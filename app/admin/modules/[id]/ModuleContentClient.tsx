"use client";

import { useState } from "react";
import Link from "next/link";
import { ModuleRow, LessonRow, QuizRow } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, Badge } from "@/components/ui/Card";
import { Modal, FormRow, inputClass } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { FileUploader, UploadResult } from "@/components/FileUploader";
import { formatBytes } from "@/lib/utils";

const TYPE_ICON: Record<string, string> = { video: "🎥", document: "📄", link: "🔗", quiz: "📝" };

export function ModuleContentClient({ module, initialLessons, quizzes }: {
  module: ModuleRow; initialLessons: LessonRow[]; quizzes: QuizRow[];
}) {
  const [lessons, setLessons] = useState(initialLessons);
  const [modalOpen, setModalOpen] = useState(false);
  const [contentType, setContentType] = useState<"video" | "document" | "link" | "quiz">("video");
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [uploadedFile, setUploadedFile] = useState<UploadResult | null>(null);
  const toast = useToast();
  const supabase = createClient();

  function openAdd(type: typeof contentType) {
    setContentType(type);
    setTitre(""); setDescription(""); setLinkUrl(""); setSelectedQuizId(""); setUploadedFile(null);
    setModalOpen(true);
  }

  async function handleAddContent() {
    if (!titre.trim() && contentType !== "quiz") { toast("⚠️ Le titre est obligatoire."); return; }

    let fileId: string | null = null;
    if ((contentType === "video" || contentType === "document") && uploadedFile) {
      const { data: fileRow, error: fileError } = await supabase.from("files").insert({
        kind: contentType === "video" ? "video" : "document",
        nom_original: uploadedFile.fileName,
        storage_bucket: uploadedFile.bucket,
        storage_path: uploadedFile.path,
        mime_type: uploadedFile.mimeType,
        size_bytes: uploadedFile.sizeBytes,
        module_id: module.id,
      }).select().single();
      if (fileError) { toast("⚠️ " + fileError.message); return; }
      fileId = fileRow.id;
    } else if ((contentType === "video" || contentType === "document")) {
      toast("⚠️ Importe d'abord un fichier."); return;
    }

    const { data: newLesson, error } = await supabase.from("lessons").insert({
      module_id: module.id,
      type: contentType,
      numero: lessons.length + 1,
      titre: contentType === "quiz" ? (quizzes.find((q) => q.id === selectedQuizId)?.titre || "Quiz") : titre,
      description,
      file_id: fileId,
      url: contentType === "link" ? linkUrl : null,
      quiz_id: contentType === "quiz" ? selectedQuizId : null,
      ordre: lessons.length,
    }).select().single();

    if (error) { toast("⚠️ " + error.message); return; }
    setLessons((prev) => [...prev, newLesson]);
    toast("✅ Contenu ajouté au module");
    setModalOpen(false);
  }

  async function handleDeleteLesson(l: LessonRow) {
    if (!confirm("Supprimer ce contenu du module ?")) return;
    const { error } = await supabase.from("lessons").delete().eq("id", l.id);
    if (error) { toast("⚠️ " + error.message); return; }
    setLessons((prev) => prev.filter((x) => x.id !== l.id));
    toast("🗑️ Contenu supprimé");
  }

  async function move(l: LessonRow, dir: -1 | 1) {
    const sorted = [...lessons].sort((a, b) => a.ordre - b.ordre);
    const idx = sorted.findIndex((x) => x.id === l.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    await supabase.from("lessons").update({ ordre: b.ordre }).eq("id", a.id);
    await supabase.from("lessons").update({ ordre: a.ordre }).eq("id", b.id);
    setLessons((prev) => prev.map((x) => x.id === a.id ? { ...x, ordre: b.ordre } : x.id === b.id ? { ...x, ordre: a.ordre } : x));
  }

  return (
    <div>
      <Link href="/admin/modules" className="text-xs font-bold text-[var(--gray)] mb-3 inline-block">← Retour aux modules</Link>
      <div className="flex justify-between items-start gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">Module {module.numero} — {module.nom}</h1>
          <p className="text-sm text-[var(--gray)]">{module.description}</p>
        </div>
      </div>

      <Card className="mb-5">
        <h3 className="font-bold text-sm mb-3">Ajouter du contenu</h3>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => openAdd("video")}>🎥 Vidéo</Button>
          <Button onClick={() => openAdd("document")}>📄 Document</Button>
          <Button onClick={() => openAdd("link")}>🔗 Lien</Button>
          <Button onClick={() => openAdd("quiz")}>📝 Quiz</Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {lessons.length === 0 && <p className="text-sm text-[var(--gray)] p-5">Aucun contenu pour le moment.</p>}
        {[...lessons].sort((a, b) => a.ordre - b.ordre).map((l, idx, arr) => (
          <div key={l.id} className="flex items-center gap-3 p-4 border-b border-[var(--line)] last:border-0">
            <span className="text-lg flex-shrink-0">{TYPE_ICON[l.type]}</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{l.titre}</div>
              <div className="text-xs text-[var(--gray)] truncate">{l.description}</div>
            </div>
            <Badge tone="blue">{l.statut}</Badge>
            <div className="flex gap-1 flex-shrink-0">
              <button disabled={idx === 0} onClick={() => move(l, -1)} className="w-7 h-7 rounded-lg border border-[var(--line)] disabled:opacity-30">↑</button>
              <button disabled={idx === arr.length - 1} onClick={() => move(l, 1)} className="w-7 h-7 rounded-lg border border-[var(--line)] disabled:opacity-30">↓</button>
              <button onClick={() => handleDeleteLesson(l)} className="w-7 h-7 rounded-lg border border-[var(--line)] text-red-600">🗑️</button>
            </div>
          </div>
        ))}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={"Ajouter : " + TYPE_ICON[contentType] + " " + contentType} wide
        footer={<>
          <Button onClick={() => setModalOpen(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleAddContent}>Ajouter</Button>
        </>}>
        {contentType === "quiz" ? (
          <FormRow label="Choisir un quiz existant">
            <select className={inputClass} value={selectedQuizId} onChange={(e) => setSelectedQuizId(e.target.value)}>
              <option value="">— Sélectionner —</option>
              {quizzes.map((q) => <option key={q.id} value={q.id}>{q.titre}</option>)}
            </select>
            {quizzes.length === 0 && <p className="text-xs text-[var(--gray)] mt-2">Aucun quiz pour ce module. Crée-en un depuis la page « Quiz », puis reviens ici.</p>}
          </FormRow>
        ) : (
          <>
            <FormRow label="Titre"><input className={inputClass} value={titre} onChange={(e) => setTitre(e.target.value)} /></FormRow>
            <FormRow label="Description"><textarea className={inputClass} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></FormRow>
            {contentType === "link" && (
              <FormRow label="URL"><input className={inputClass} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" /></FormRow>
            )}
            {(contentType === "video" || contentType === "document") && (
              <FormRow label={contentType === "video" ? "Importer la vidéo" : "Importer le document"}>
                <FileUploader
                  accept={contentType}
                  multiple={false}
                  moduleId={module.id}
                  onUploaded={(res) => { setUploadedFile(res); toast("✅ " + res.fileName + " importé"); }}
                />
                {uploadedFile && <p className="text-xs text-emerald-600 font-semibold mt-2">✅ {uploadedFile.fileName} ({formatBytes(uploadedFile.sizeBytes)}) prêt</p>}
              </FormRow>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
