"use client";

import { useMemo, useState } from "react";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatBytes, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";

const KIND_ICON: Record<string, string> = { video: "🎥", image: "🖼️", document: "📄", other: "📦" };
const KIND_LABEL: Record<string, string> = { video: "Vidéos", image: "Images", document: "Documents", other: "Autres fichiers" };

export function LibraryClient({ initialFiles }: { initialFiles: any[] }) {
  const [files, setFiles] = useState(initialFiles);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "size">("recent");
  const toast = useToast();
  const supabase = createClient();

  const filtered = useMemo(() => {
    let list = files.filter((f) => (kindFilter === "all" || f.kind === kindFilter) && f.nom_original.toLowerCase().includes(query.toLowerCase()));
    if (sortBy === "name") list = [...list].sort((a, b) => a.nom_original.localeCompare(b.nom_original));
    if (sortBy === "size") list = [...list].sort((a, b) => (b.size_bytes || 0) - (a.size_bytes || 0));
    if (sortBy === "recent") list = [...list].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return list;
  }, [files, query, kindFilter, sortBy]);

  async function handleRename(f: any) {
    const newName = prompt("Nouveau nom :", f.nom_original);
    if (!newName || newName === f.nom_original) return;
    const { error } = await supabase.from("files").update({ nom_original: newName }).eq("id", f.id);
    if (error) { toast("⚠️ " + error.message); return; }
    setFiles((prev) => prev.map((x) => x.id === f.id ? { ...x, nom_original: newName } : x));
    toast("✅ Fichier renommé");
  }

  async function handleDelete(f: any) {
    if (!confirm(`Supprimer "${f.nom_original}" du stockage et de la bibliothèque ?`)) return;
    await supabase.storage.from(f.storage_bucket).remove([f.storage_path]);
    const { error } = await supabase.from("files").delete().eq("id", f.id);
    if (error) { toast("⚠️ " + error.message); return; }
    setFiles((prev) => prev.filter((x) => x.id !== f.id));
    toast("🗑️ Fichier supprimé");
  }

  async function handleCopyLink(f: any) {
    if (f.kind === "image") {
      const { data } = supabase.storage.from(f.storage_bucket).getPublicUrl(f.storage_path);
      await navigator.clipboard.writeText(data.publicUrl);
      toast("🔗 Lien copié");
    } else {
      toast("ℹ️ Ce fichier est privé : utilise le lecteur protégé pour y accéder, pas de lien public.");
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold mb-1">Ma bibliothèque</h1>
        <p className="text-sm text-[var(--gray)]">Tous les fichiers importés dans la plateforme : vidéos, images, documents.</p>
      </div>

      <div className="flex flex-wrap gap-2.5 mb-5">
        <input
          value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="🔎 Rechercher un fichier…"
          className="flex-1 min-w-[200px] px-3.5 py-2.5 rounded-lg border border-[var(--line)] bg-white dark:bg-[#131A21] text-sm"
        />
        <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value)} className="px-3.5 py-2.5 rounded-lg border border-[var(--line)] bg-white dark:bg-[#131A21] text-sm">
          <option value="all">Tous les types</option>
          <option value="video">🎥 Vidéos</option>
          <option value="image">🖼️ Images</option>
          <option value="document">📄 Documents</option>
          <option value="other">📦 Autres</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-3.5 py-2.5 rounded-lg border border-[var(--line)] bg-white dark:bg-[#131A21] text-sm">
          <option value="recent">Plus récent</option>
          <option value="name">Nom (A-Z)</option>
          <option value="size">Taille</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.map((f) => (
          <Card key={f.id} className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-[var(--bg-soft)] flex items-center justify-center text-xl flex-shrink-0">{KIND_ICON[f.kind]}</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate" title={f.nom_original}>{f.nom_original}</div>
              <div className="text-xs text-[var(--gray)]">{formatBytes(f.size_bytes)} · {formatDate(f.created_at)}</div>
              {f.modules?.nom && <Badge tone="blue">{f.modules.nom}</Badge>}
              <div className="flex gap-1.5 mt-2.5 flex-wrap">
                <button onClick={() => handleCopyLink(f)} className="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[var(--line)]">🔗 Lien</button>
                <button onClick={() => handleRename(f)} className="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[var(--line)]">✏️ Renommer</button>
                <button onClick={() => handleDelete(f)} className="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[var(--line)] text-red-600">🗑️</button>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-sm text-[var(--gray)] col-span-full text-center py-10">Aucun fichier ne correspond à ta recherche.</p>}
      </div>
    </div>
  );
}
