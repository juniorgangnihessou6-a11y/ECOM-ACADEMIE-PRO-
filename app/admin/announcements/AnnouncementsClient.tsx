"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, Badge } from "@/components/ui/Card";
import { Modal, FormRow, inputClass } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { AnnouncementRow } from "@/lib/types";

const TYPE_TONE: Record<string, "blue" | "green" | "gray" | "red"> = {
  information: "blue", nouveaute: "green", rappel: "gray", urgent: "red",
};

export function AnnouncementsClient({ initialAnnouncements }: { initialAnnouncements: AnnouncementRow[] }) {
  const [items, setItems] = useState(initialAnnouncements);
  const [modalOpen, setModalOpen] = useState(false);
  const [titre, setTitre] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<AnnouncementRow["type"]>("information");
  const toast = useToast();
  const supabase = createClient();

  async function handleCreate() {
    if (!titre.trim() || !message.trim()) { toast("⚠️ Titre et message sont obligatoires."); return; }
    const { data, error } = await supabase.from("announcements").insert({ titre, message, type }).select().single();
    if (error) { toast("⚠️ " + error.message); return; }
    setItems((prev) => [data, ...prev]);
    toast("✅ Annonce publiée");
    setModalOpen(false);
    setTitre(""); setMessage(""); setType("information");
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette annonce ?")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) { toast("⚠️ " + error.message); return; }
    setItems((prev) => prev.filter((a) => a.id !== id));
    toast("🗑️ Annonce supprimée");
  }

  return (
    <div>
      <div className="flex justify-between items-start gap-4 mb-6 flex-wrap">
        <div><h1 className="text-2xl font-extrabold mb-1">Annonces</h1><p className="text-sm text-[var(--gray)]">Communique avec tous tes élèves.</p></div>
        <Button variant="primary" onClick={() => setModalOpen(true)}>+ Nouvelle annonce</Button>
      </div>

      {items.length === 0 && <p className="text-sm text-[var(--gray)]">Aucune annonce.</p>}
      {items.map((a) => (
        <Card key={a.id} className="mb-3 border-l-4" style={{ borderLeftColor: "var(--teal)" }}>
          <div className="flex justify-between items-start gap-3">
            <div>
              <div className="font-bold text-sm mb-1">📢 {a.titre}</div>
              <p className="text-sm text-[var(--gray)] mb-2">{a.message}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--gray)]">{formatDate(a.created_at)}</span>
                <Badge tone={TYPE_TONE[a.type]}>{a.type}</Badge>
              </div>
            </div>
            <button onClick={() => handleDelete(a.id)} className="text-xs font-bold text-red-600 border border-[var(--line)] px-2.5 py-1 rounded-lg flex-shrink-0">🗑️</button>
          </div>
        </Card>
      ))}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouvelle annonce"
        footer={<><Button onClick={() => setModalOpen(false)}>Annuler</Button><Button variant="primary" onClick={handleCreate}>Publier</Button></>}>
        <FormRow label="Titre"><input className={inputClass} value={titre} onChange={(e) => setTitre(e.target.value)} /></FormRow>
        <FormRow label="Message"><textarea className={inputClass} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} /></FormRow>
        <FormRow label="Type">
          <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as any)}>
            <option value="information">Information</option>
            <option value="nouveaute">Nouveauté</option>
            <option value="rappel">Rappel</option>
            <option value="urgent">Urgent</option>
          </select>
        </FormRow>
      </Modal>
    </div>
  );
}
