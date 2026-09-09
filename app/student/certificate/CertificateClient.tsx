"use client";

import { Profile } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";

export function CertificateClient({ pct, profile, certificate }: { pct: number; profile: Profile; certificate: any }) {
  if (pct < 100 || !certificate) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-1">Mon certificat</h1>
        <div className="bg-white dark:bg-[#131A21] border border-[var(--line)] rounded-2xl p-10 text-center mt-6">
          <div className="text-4xl mb-3">🔒</div>
          <h3 className="font-bold mb-2">Certificat verrouillé</h3>
          <p className="text-sm text-[var(--gray)] mb-5">Termine 100% de l'accompagnement pour débloquer ton certificat. Progression actuelle : {pct}%.</p>
          <div className="max-w-xs mx-auto"><ProgressBar pct={pct} /></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6 no-print">
        <div className="text-4xl mb-2">🎉</div>
        <h1 className="text-xl font-extrabold mb-1">Félicitations !</h1>
        <p className="text-sm text-[var(--gray)]">Vous avez terminé ECOM ACADÉMIE PRO.</p>
      </div>

      <div className="bg-gradient-to-br from-white to-[var(--bg-soft)] border-[3px] border-teal-400 rounded-2xl p-14 text-center max-w-2xl mx-auto">
        <div className="text-xs tracking-[3px] uppercase text-[var(--blue)] font-extrabold mb-6">Ecom Académie Pro</div>
        <h2 className="text-3xl font-extrabold mb-2">Certificat de réussite</h2>
        <p className="text-sm text-[var(--gray)] mb-6">Ce certificat est décerné à</p>
        <div className="text-3xl font-extrabold italic border-b-2 border-[var(--line)] inline-block pb-2.5 mb-4">{profile.prenom} {profile.nom}</div>
        <p className="text-sm">pour avoir complété avec succès l'ensemble de la formation Ecom Académie Pro.</p>
        <div className="text-xs text-[var(--gray)] mt-5">Délivré le {formatDate(certificate.delivre_le)} · N° {certificate.numero}</div>
        <div className="mt-8 font-extrabold text-[var(--blue)]">Ecom Académie Pro</div>
      </div>

      <div className="text-center mt-6 no-print">
        <Button variant="primary" onClick={() => window.print()}>Télécharger / Imprimer le certificat</Button>
      </div>
    </div>
  );
}
