"use client";

import { useState } from "react";
import Link from "next/link";
import { Profile } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, StatCard } from "@/components/ui/Card";
import { FormRow, inputClass } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { initials, formatDate } from "@/lib/utils";
import { FileUploader } from "@/components/FileUploader";

export function ProfileClient({ profile, pct, modulesTermines, totalModules, quizCount, hasCertificate }: {
  profile: Profile; pct: number; modulesTermines: number; totalModules: number; quizCount: number; hasCertificate: boolean;
}) {
  const [form, setForm] = useState({ prenom: profile.prenom, nom: profile.nom, telephone: profile.telephone || "", avatar_url: profile.avatar_url || "" });
  const toast = useToast();
  const supabase = createClient();

  async function handleSave() {
    const { error } = await supabase.from("profiles").update({
      prenom: form.prenom, nom: form.nom, telephone: form.telephone, avatar_url: form.avatar_url,
    }).eq("id", profile.id);
    if (error) { toast("⚠️ " + error.message); return; }
    toast("✅ Modifications enregistrées");
  }

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-extrabold mb-1">Mon profil</h1></div>

      <Card className="mb-4">
        <div className="flex items-center gap-4 mb-5">
          {form.avatar_url ? (
            <img src={form.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full brand-gradient flex items-center justify-center text-white font-extrabold text-xl">{initials(profile.prenom, profile.nom)}</div>
          )}
          <div>
            <div className="font-bold text-lg">{profile.prenom} {profile.nom}</div>
            <div className="text-xs text-[var(--gray)]">{profile.email}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <StatCard icon="📈" value={pct + "%"} label="Progression" />
          <StatCard icon="📚" value={`${modulesTermines}/${totalModules}`} label="Modules terminés" />
          <StatCard icon="📝" value={quizCount} label="Quiz réalisés" />
        </div>

        {hasCertificate && (
          <Link href="/student/certificate" className="inline-block mb-5 text-sm font-bold text-[var(--blue)] underline">🏆 Voir mon certificat</Link>
        )}
      </Card>

      <Card>
        <h3 className="font-bold text-sm mb-3.5">Modifier mes informations</h3>
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Prénom"><input className={inputClass} value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} /></FormRow>
          <FormRow label="Nom"><input className={inputClass} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></FormRow>
        </div>
        <FormRow label="Téléphone"><input className={inputClass} value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></FormRow>
        <FormRow label="Email"><div className="text-sm text-[var(--gray)]">{profile.email} (non modifiable)</div></FormRow>
        <FormRow label="Date d'inscription"><div className="text-sm text-[var(--gray)]">{formatDate(profile.date_inscription)}</div></FormRow>
        <FormRow label="Photo de profil">
          <FileUploader accept="image" multiple={false} pathPrefix={`avatars/${profile.id}/`} onUploaded={(res) => {
            const { data } = supabase.storage.from(res.bucket).getPublicUrl(res.path);
            setForm((f) => ({ ...f, avatar_url: data.publicUrl }));
            toast("✅ Photo importée — clique sur Enregistrer");
          }} />
        </FormRow>
        <Button variant="primary" onClick={handleSave}>Enregistrer</Button>
      </Card>
    </div>
  );
}
