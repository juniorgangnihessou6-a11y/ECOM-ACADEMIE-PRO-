"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal, FormRow, inputClass } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { FileUploader, UploadResult } from "@/components/FileUploader";

const TYPE_ICON: Record<string, string> = { pdf: "📄", document: "📝", lien: "🔗", outil: "🛠️" };

export function ResourcesClient({ initialResources, modules }: { initialResources: any[]; modules: any[] }) {
  const [resources, setResources] = useState(initialResources);
  const [modalOpen, setModalOpen] = useState(false);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("pdf");
  const [moduleId, setModuleId] = useState("");
  const [url, setUrl] = useState("");
  const [uploaded, setUploaded] = useState<UploadResult | null>(null);
  const toast = useToast();
  const supabase = createClient();

  async function handleCreate() {
    if (!nom.trim()) { toast("⚠️ Le nom est obligatoire."); return; }
    if (!url.trim() && !uploaded) { toast("⚠️ Ajoute une URL ou importe un fichier."); return; }

    let fileId: string | null = null;
    if (uploaded) {
      const { data: fileRow, error } = await supabase.from("files").insert({
        kind: "document", nom_original: uploaded.fileName, storage_bucket: uploaded.bucket,
        storage_path: uploaded.path, mime_type: uploaded.mimeType, size_bytes: uploaded.sizeBytes,
        module_id: moduleId || null,
      }).select().single();
      if (error) { toast("⚠️ " + error.message); return; }
      fileId = fileRow.id;
    }

    const { data, error } = await supabase.from("resources").insert({
      nom, description, type, module_id: moduleId || null, file_id: fileId, url: url || null,
    }).select().single();
    if (error) { toast("⚠️ " + error.message); return; }
    setResources((prev) => [data, ...prev]);
    toast("✅ Ressource ajoutée");
    setModalOpen(false);
    setNom(""); setDescription(""); setUrl(""); setUploaded(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette ressource ?")) return;
    const { error } = await supabase.from("resources").delete().eq("id", id);
    if (error) { toast("⚠️ " + error.message); return; }
    setResources((prev) => prev.filter((r) => r.id !== id));
    toast("🗑️ Ressource supprimée");
  }

  return (
    <div>
      <div className="flex justify-between items-start gap-4 mb-6 flex-wrap">
        <div><h1 className="text-2xl font-extrabold mb-1">Ressources</h1><p className="text-sm text-[var(--gray)]">PDF, documents, liens et outils par module.</p></div>
        <Button variant="primary" onClick={() => setModalOpen(true)}>+ Ajouter une ressource</Button>
      </div>

      {resources.map((r) => (
        <Card key={r.id} className="mb-3 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[var(--bg-soft)] flex items-center justify-center text-lg flex-shrink-0">{TYPE_ICON[r.type] || "📁"}</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">{r.nom}</div>
            <div className="text-xs text-[var(--gray)]">{r.description} {r.modules?.nom && "· " + r.modules.nom}</div>
          </div>
          {r.url && <a href={r.url} target="_blank" rel="noopener" className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--line)] flex-shrink-0">Ouvrir</a>}
          <button onClick={() => handleDelete(r.id)} className="w-8 h-8 rounded-lg border border-[var(--line)] text-red-600 flex-shrink-0">🗑️</button>
        </Card>
      ))}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Ajouter une ressource" wide
        footer={<><Button onClick={() => setModalOpen(false)}>Annuler</Button><Button variant="primary" onClick={handleCreate}>Ajouter</Button></>}>
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Nom"><input className={inputClass} value={nom} onChange={(e) => setNom(e.target.value)} /></FormRow>
          <FormRow label="Type">
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="pdf">PDF</option><option value="document">Document</option><option value="lien">Lien</option><option value="outil">Outil</option>
            </select>
          </FormRow>
        </div>
        <FormRow label="Description"><textarea className={inputClass} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></FormRow>
        <FormRow label="Module associé (optionnel)">
          <select className={inputClass} value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
            <option value="">— Aucun —</option>
            {modules.map((m) => <option key={m.id} value={m.id}>Module {m.numero} — {m.nom}</option>)}
          </select>
        </FormRow>
        <FormRow label="URL (si lien externe)"><input className={inputClass} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" /></FormRow>
        <FormRow label="Ou importer un fichier">
          <FileUploader accept="document" multiple={false} onUploaded={(res) => { setUploaded(res); toast("✅ " + res.fileName + " importé"); }} />
        </FormRow>
      </Modal>
    </div>
  );
}
