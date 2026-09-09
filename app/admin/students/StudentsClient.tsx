"use client";

import { useState } from "react";
import { Profile } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, Badge, ProgressBar } from "@/components/ui/Card";
import { Modal, FormRow, inputClass } from "@/components/ui/Modal";
import { formatDate, formatDateTime, initials } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

export function StudentsClient({ initialStudents, totalLessons, progressByUser }: {
  initialStudents: Profile[];
  totalLessons: number;
  progressByUser: Record<string, number>;
}) {
  const [students, setStudents] = useState(initialStudents);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewing, setViewing] = useState<Profile | null>(null);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const [form, setForm] = useState({
    prenom: "", nom: "", email: "", telephone: "", password: "", access_start: "", access_end: "",
  });

  function openCreate() {
    setEditing(null);
    setForm({ prenom: "", nom: "", email: "", telephone: "", password: "", access_start: "", access_end: "" });
    setModalOpen(true);
  }

  function openEdit(s: Profile) {
    setEditing(s);
    setForm({
      prenom: s.prenom, nom: s.nom, email: s.email || "", telephone: s.telephone || "",
      password: "", access_start: s.access_start || "", access_end: s.access_end || "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.prenom.trim() || !form.nom.trim() || (!editing && !form.email.trim())) {
      toast("⚠️ Prénom, nom et email sont obligatoires."); return;
    }
    setSaving(true);
    try {
      if (editing) {
        const res = await fetch("/api/admin/students", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editing.id, prenom: form.prenom, nom: form.nom, telephone: form.telephone,
            statut: editing.statut, access_start: form.access_start, access_end: form.access_end,
            password: form.password || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) { toast("⚠️ " + data.error); setSaving(false); return; }
        setStudents((prev) => prev.map((s) => s.id === editing.id ? { ...s, ...form } : s));
        toast("✅ Modifications enregistrées");
      } else {
        if (!form.password.trim()) { toast("⚠️ Mot de passe temporaire obligatoire."); setSaving(false); return; }
        const res = await fetch("/api/admin/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) { toast("⚠️ " + data.error); setSaving(false); return; }
        setStudents((prev) => [{
          id: data.id, role: "student", prenom: form.prenom, nom: form.nom, email: form.email,
          telephone: form.telephone, avatar_url: null, statut: "active",
          access_start: form.access_start || null, access_end: form.access_end || null,
          date_inscription: new Date().toISOString(), last_login: null,
        }, ...prev]);
        toast("✅ Élève créé avec succès");
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function toggleSuspend(s: Profile) {
    const newStatus = s.statut === "active" ? "suspended" : "active";
    const res = await fetch("/api/admin/students", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, prenom: s.prenom, nom: s.nom, telephone: s.telephone, statut: newStatus, access_start: s.access_start, access_end: s.access_end }),
    });
    if (res.ok) {
      setStudents((prev) => prev.map((x) => x.id === s.id ? { ...x, statut: newStatus } : x));
      toast(newStatus === "active" ? "🔓 Compte réactivé" : "🔒 Compte suspendu");
    }
  }

  async function handleDelete(s: Profile) {
    if (!confirm(`Supprimer définitivement ${s.prenom} ${s.nom} ?`)) return;
    const res = await fetch("/api/admin/students", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id }) });
    if (res.ok) {
      setStudents((prev) => prev.filter((x) => x.id !== s.id));
      toast("🗑️ Élève supprimé");
    }
  }

  return (
    <div>
      <div className="flex justify-between items-start gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">Gestion des élèves</h1>
          <p className="text-sm text-[var(--gray)]">Ajoute, modifie ou suspends les comptes de tes élèves.</p>
        </div>
        <Button variant="primary" onClick={openCreate}>+ Ajouter un élève</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--gray)] border-b border-[var(--line)]">
                <th className="p-3">Nom</th><th className="p-3">Email</th><th className="p-3">Inscription</th>
                <th className="p-3">Progression</th><th className="p-3">Dernière connexion</th><th className="p-3">Statut</th><th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const pct = totalLessons ? Math.round(((progressByUser[s.id] || 0) / totalLessons) * 100) : 0;
                return (
                  <tr key={s.id} className="border-b border-[var(--line)] last:border-0 text-sm">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full brand-gradient flex items-center justify-center text-white text-[10px] font-extrabold">{initials(s.prenom, s.nom)}</div>
                        <span className="font-semibold">{s.prenom} {s.nom}</span>
                      </div>
                    </td>
                    <td className="p-3 text-[var(--gray)]">{s.email}</td>
                    <td className="p-3">{formatDate(s.date_inscription)}</td>
                    <td className="p-3"><div className="flex items-center gap-2 w-32"><ProgressBar pct={pct} sm /><span className="text-xs">{pct}%</span></div></td>
                    <td className="p-3 text-xs text-[var(--gray)]">{formatDateTime(s.last_login)}</td>
                    <td className="p-3">
                      {s.statut === "active" && <Badge tone="green">🟢 Actif</Badge>}
                      {s.statut === "suspended" && <Badge tone="red">🔴 Suspendu</Badge>}
                      {s.statut === "expired" && <Badge tone="orange">⏳ Expiré</Badge>}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1.5">
                        <button title="Voir" onClick={() => setViewing(s)} className="w-8 h-8 rounded-lg border border-[var(--line)]">👁️</button>
                        <button title="Modifier" onClick={() => openEdit(s)} className="w-8 h-8 rounded-lg border border-[var(--line)]">✏️</button>
                        <button title="Suspendre" onClick={() => toggleSuspend(s)} className="w-8 h-8 rounded-lg border border-[var(--line)]">🔒</button>
                        <button title="Supprimer" onClick={() => handleDelete(s)} className="w-8 h-8 rounded-lg border border-[var(--line)]">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Modifier l'élève" : "Ajouter un élève"}
        footer={<>
          <Button onClick={() => setModalOpen(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>{editing ? "Enregistrer" : "Créer l'élève"}</Button>
        </>}>
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Prénom"><input className={inputClass} value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} /></FormRow>
          <FormRow label="Nom"><input className={inputClass} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></FormRow>
          <FormRow label="Email"><input className={inputClass} type="email" disabled={!!editing} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FormRow>
          <FormRow label="Téléphone"><input className={inputClass} value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></FormRow>
          <FormRow label={editing ? "Nouveau mot de passe (optionnel)" : "Mot de passe temporaire"}>
            <input className={inputClass} type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </FormRow>
          <div />
          <FormRow label="Date de début d'accès"><input className={inputClass} type="date" value={form.access_start} onChange={(e) => setForm({ ...form, access_start: e.target.value })} /></FormRow>
          <FormRow label="Date de fin d'accès"><input className={inputClass} type="date" value={form.access_end} onChange={(e) => setForm({ ...form, access_end: e.target.value })} /></FormRow>
        </div>
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Fiche élève" footer={<Button onClick={() => setViewing(null)}>Fermer</Button>}>
        {viewing && (
          <div>
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-14 h-14 rounded-full brand-gradient flex items-center justify-center text-white font-extrabold text-lg">{initials(viewing.prenom, viewing.nom)}</div>
              <div>
                <div className="font-bold">{viewing.prenom} {viewing.nom}</div>
                <div className="text-xs text-[var(--gray)]">{viewing.email}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-xs text-[var(--gray)] uppercase font-bold mb-1">Téléphone</div>{viewing.telephone || "—"}</div>
              <div><div className="text-xs text-[var(--gray)] uppercase font-bold mb-1">Statut</div>{viewing.statut}</div>
              <div><div className="text-xs text-[var(--gray)] uppercase font-bold mb-1">Accès du</div>{formatDate(viewing.access_start)}</div>
              <div><div className="text-xs text-[var(--gray)] uppercase font-bold mb-1">Accès jusqu'au</div>{formatDate(viewing.access_end)}</div>
              <div><div className="text-xs text-[var(--gray)] uppercase font-bold mb-1">Progression</div>{totalLessons ? Math.round(((progressByUser[viewing.id] || 0) / totalLessons) * 100) : 0}%</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
