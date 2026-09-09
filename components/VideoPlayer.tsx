"use client";

/**
 * Lecteur vidéo protégé : ne reçoit jamais l'URL publique du fichier.
 * Il demande à la route API /api/media/signed-url une URL signée à durée
 * de vie courte (voir cette route pour la vérification des permissions),
 * puis la donne à la balise <video>. La vidéo n'est donc jamais accessible
 * par une URL fixe et partageable indéfiniment.
 */

import { useEffect, useState } from "react";

export function VideoPlayer({ fileId }: { fileId: string | null }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) return;
    let cancelled = false;
    setSignedUrl(null);
    setError(null);

    fetch(`/api/media/signed-url?file_id=${fileId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.url) setSignedUrl(data.url);
        else setError(data.error || "Impossible de charger la vidéo.");
      })
      .catch(() => { if (!cancelled) setError("Erreur réseau."); });

    return () => { cancelled = true; };
  }, [fileId]);

  if (!fileId) {
    return (
      <div className="w-full aspect-video bg-black rounded-2xl flex items-center justify-center text-white/60 text-sm">
        Aucune vidéo pour cette leçon.
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full aspect-video bg-black rounded-2xl flex items-center justify-center text-white/70 text-sm px-6 text-center">
        ⚠️ {error}
      </div>
    );
  }

  if (!signedUrl) {
    return (
      <div className="w-full aspect-video bg-black rounded-2xl flex items-center justify-center text-white/50 text-sm animate-pulse">
        Chargement de la vidéo…
      </div>
    );
  }

  return (
    <video
      key={signedUrl}
      controls
      controlsList="nodownload"
      className="w-full aspect-video bg-black rounded-2xl"
      src={signedUrl}
    />
  );
}
