"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Modal";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") === "suspended" ? "Ce compte est suspendu. Contacte l'administrateur." : null
  );
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (authError) {
      setError("Identifiant ou mot de passe incorrect.");
      return;
    }

    if (remember) localStorage.setItem("ecomAcademieRememberedEmail", email);
    else localStorage.removeItem("ecomAcademieRememberedEmail");

    const { data: profile } = await supabase.from("profiles").select("role, statut").eq("id", data.user.id).single();

    if (profile?.statut === "suspended") {
      await supabase.auth.signOut();
      setError("Ce compte est suspendu. Contacte l'administrateur.");
      return;
    }

    await supabase.from("profiles").update({ last_login: new Date().toISOString() }).eq("id", data.user.id);

    const next = params.get("next");
    router.push(next || (profile?.role === "admin" ? "/admin" : "/student"));
    router.refresh();
  }

  async function handleForgotPassword() {
    if (!email) { setError("Renseigne ton email ci-dessus, puis clique à nouveau sur ce lien."); return; }
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
    });
    if (!resetError) setResetSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background: "linear-gradient(160deg, #0FCFA4 0%, #12A6D9 45%, #1E63E9 100%)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] p-9 pb-8 text-center animate-fadeUp">
        <div className="w-16 h-16 rounded-2xl brand-gradient mx-auto mb-4 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
          EA
        </div>
        <h1 className="text-xl font-extrabold mb-1.5">Bienvenue sur Ecom Académie Pro</h1>
        <p className="text-sm text-[var(--gray)] mb-6">Connecte-toi pour accéder à ta formation.</p>

        {error && <div className="bg-red-50 text-red-600 text-xs font-semibold px-3 py-2.5 rounded-lg mb-3.5 text-left">{error}</div>}
        {resetSent && <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-2.5 rounded-lg mb-3.5 text-left">✅ Email de réinitialisation envoyé, vérifie ta boîte mail.</div>}

        <form onSubmit={handleSubmit} className="text-left">
          <div className="mb-3.5">
            <label className="block text-xs font-bold text-[var(--gray)] uppercase tracking-wide mb-1.5">Identifiant ou email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="toi@example.com" />
          </div>
          <div className="mb-2">
            <label className="block text-xs font-bold text-[var(--gray)] uppercase tracking-wide mb-1.5">Mot de passe</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
          </div>
          <div className="text-right mb-4">
            <button type="button" onClick={handleForgotPassword} className="text-xs text-[var(--blue)] font-semibold hover:underline">
              Mot de passe oublié ?
            </button>
          </div>
          <label className="flex items-center gap-2 text-xs text-[var(--gray)] mb-5">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-[var(--teal)]" />
            Se souvenir de moi
          </label>
          <Button type="submit" variant="primary" className="w-full justify-center" disabled={loading}>
            {loading ? "Connexion…" : "Se connecter"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
