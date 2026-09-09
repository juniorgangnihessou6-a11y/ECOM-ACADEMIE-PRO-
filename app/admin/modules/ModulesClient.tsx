"use client";

import { useState } from "react";
import Link from "next/link";
import { ModuleRow } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, Badge } from "@/components/ui/Card";
import { Modal, FormRow, inputClass } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { FileUploader } from "@/components/FileUploader";

export function ModulesClient({ initialModules, lessonCounts }: { initialModules: ModuleRow[]; lessonCounts: Record<string, number> }) {
  const [modules, setModules] = useState(initialModules);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ModuleRow | null>(null);
  const [form, setForm] = useState({ numero: modules.length + 1, nom: "", description: "", statut: "publie", cover_url: "" });
  const toast = useToast();
  const supabase = createClient();

  function openCreate() {
    setEditing(null);
    setForm({ numero: modules.length + 1, nom: "", description: "", statut: "publie", cover_url: "" });
    setModalOpen(true);
  }
  function openEdit(m: ModuleRow) {
    setEditing(m);
    setForm({ numero: m.numero, nom: m.nom, description: m.description, statut: m.statut, cover_url: m.cover_url || "" });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.nom.trim()) { toast("⚠️ Le nom du module est obligatoire."); return; }
    if (editing) {
      const { error } = await supabase.from("modules").update(form).eq("id", editing.id);
      if (error) { toast("⚠️ " + error.message); return; }
      setModules((prev) => prev.map((m) => m.id === editing.id ? { ...m, ...form } : m));
      toast("✅ Module modifié");
    } else {
      const { data, error } = await supabase.from("modules").insert({ ...form, ordre: modules.length }).select().single();
      if (error) { toast("⚠️ " + error.message); return; }
      setModules((prev) => [...prev, data]);
      toast("✅ Module créé");
    }
    setModalOpen(false);
  }

  async function handleDelete(m: ModuleRow) {
    if (!confirm("Supprimer ce module ainsi que ses vidéos et son quiz ?")) return;
    const { error } = await supabase.from("modules").delete().eq("id", m.id);
    if (error) { toast("⚠️ " + error.message); return; }
    setModules((prev) => prev.filter((x) => x.id !== m.id));
    toast("🗑️ Module supprimé");
  }

  async function move(m: ModuleRow, dir: -1 | 1) {
    const sorted = [...modules].sort((a, b) => a.ordre - b.ordre);
    const idx = sorted.findIndex((x) => x.id === m.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    await supabase.from("modules").update({ ordre: b.ordre }).eq("id", a.id);
    await supabase.from("modules").update({ ordre: a.ordre }).eq("id", b.id);
    setModules((prev) => prev.map((x) => x.id === a.id ? { ...x, ordre: b.ordre } : x.id === b.id ? { ...x, ordre: a.ordre } : x));
  }

  return (
    <div>
      <div className="flex justify-between items-start gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">Mes modules</h1>
          <p className="text-sm text-[var(--gray)]">Crée, réorganise et gère les modules de la formation.</p>
        </div>
        <Button variant="primary" onClick={openCreate}>+ Créer un module</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...modules].sort((a, b) => a.ordre - b.ordre).map((m, idx, arr) => (
          <Card key={m.id} className="p-0 overflow-hidden flex flex-col">
            <div className="h-28 brand-gradient flex items-center justify-center text-white font-extrabold text-xl relative"
              style={m.cover_url ? { backgroundImage: `url(${m.cover_url})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}>
              {!m.cover_url && "M" + m.numero}
              <span className="absolute top-2.5 left-2.5 bg-black/35 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">{m.statut}</span>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="font-bold text-sm mb-1.5">Module {m.numero} — {m.nom}</h3>
              <p className="text-xs text-[var(--gray)] mb-3 flex-1">{m.description}</p>
              <div className="text-[11px] font-bold text-[var(--gray)] mb-3">🎥 {lessonCounts[m.id] || 0} contenu(s)</div>
              <div className="flex gap-1.5 flex-wrap">
                <Link href={`/admin/modules/${m.id}`} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--line)]">📦 Contenu</Link>
                <button onClick={() => openEdit(m)} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--line)]">✏️</button>
                <button onClick={() => handleDelete(m)} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--line)] text-red-600">🗑️</button>
                <button disabled={idx === 0} onClick={() => move(m, -1)} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--line)] disabled:opacity-30">↑</button>
                <button disabled={idx === arr.length - 1} onClick={() => move(m, 1)} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--line)] disabled:opacity-30">↓</button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Modifier le module" : "Créer un module"}
        footer={<>
          <Button onClick={() => setModalOpen(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleSave}>{editing ? "Enregistrer" : "Créer le module"}</Button>
        </>}>
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Numéro"><input type="number" className={inputClass} value={form.numero} onChange={(e) => setForm({ ...form, numero: parseInt(e.target.value) || 1 })} /></FormRow>
          <FormRow label="Statut">
            <select className={inputClass} value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
              <option value="publie">Publié</option>
              <option value="brouillon">Brouillon</option>
            </select>
          </FormRow>
        </div>
        <FormRow label="Nom du module"><input className={inputClass} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></FormRow>
        <FormRow label="Description"><textarea className={inputClass} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormRow>
        <FormRow label="Image de couverture">
          <FileUploader accept="image" multiple={false} onUploaded={(res) => {
            const { data } = supabase.storage.from(res.bucket).getPublicUrl(res.path);
            setForm((f) => ({ ...f, cover_url: data.publicUrl }));
            toast("✅ Image importée");
          }} />
        </FormRow>
      </Modal>
    </div>
  );
}
