"use client";

/**
 * Upload direct-to-storage, résumable et par blocs (protocole TUS), utilisé
 * pour les vidéos, images et documents lourds.
 *
 * Pourquoi TUS plutôt qu'un simple <input type="file"> envoyé au serveur ?
 * - Le fichier part directement du navigateur vers Supabase Storage : il ne
 *   transite jamais par nos routes API Next.js, donc aucune limite de taille
 *   de requête serveur/plateforme d'hébergement ne s'applique.
 * - Upload par blocs (chunks) de 6 Mo minimum (limite imposée par Supabase),
 *   avec reprise automatique après coupure réseau grâce aux "fingerprints"
 *   stockés par tus-js-client.
 * - Retente automatiquement les blocs en échec (retryDelays).
 * - Peut être mis en pause et repris par l'utilisateur.
 *
 * Limites réelles à connaître (pas artificielles, imposées par le stockage) :
 * - Plan Supabase gratuit : 1 Go de stockage total, upload par fichier
 *   jusqu'à 50 Mo par défaut (configurable jusqu'à plusieurs Go sur les
 *   plans payants, voir Project Settings > Storage > Upload file size limit).
 * - Il n'y a pas de limite côté code ici : la limite vient uniquement de ton
 *   plan Supabase, indiquée clairement dans le tableau de bord Supabase.
 */

import { useCallback, useRef, useState } from "react";
import * as tus from "tus-js-client";
import { createClient } from "@/lib/supabase/client";
import { formatBytes, estimateTimeRemaining, slugify } from "@/lib/utils";
import { Button } from "./ui/Button";
import { ProgressBar } from "./ui/Card";

export interface UploadResult {
  bucket: string;
  path: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

interface UploadTask {
  id: string;
  file: File;
  upload: tus.Upload;
  bytesUploaded: number;
  bytesTotal: number;
  speed: number; // bytes/sec
  status: "uploading" | "paused" | "success" | "error";
  error?: string;
  lastTick: { time: number; bytes: number };
}

const BUCKET_BY_ACCEPT: Record<string, string> = {
  video: "videos",
  image: "images",
  document: "documents",
};

export function FileUploader({
  accept, // "video" | "image" | "document"
  multiple = true,
  moduleId,
  pathPrefix,
  onUploaded,
}: {
  accept: "video" | "image" | "document";
  multiple?: boolean;
  moduleId?: string;
  pathPrefix?: string; // e.g. "avatars/{userId}/" — overrides the default moduleId-based path
  onUploaded: (result: UploadResult) => void;
}) {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const acceptAttr =
    accept === "video" ? "video/mp4,video/quicktime,video/webm,video/*" :
    accept === "image" ? "image/jpeg,image/png,image/webp,image/svg+xml" :
    ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip";

  const startUpload = useCallback(async (file: File) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { alert("Session expirée, reconnecte-toi."); return; }

    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF;
    const bucket = BUCKET_BY_ACCEPT[accept];
    const ext = file.name.split(".").pop() || "bin";
    const path = `${pathPrefix ? pathPrefix : moduleId ? moduleId + "/" : ""}${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ""))}.${ext}`;
    const taskId = path;

    const upload = new tus.Upload(file, {
      endpoint: `https://${projectRef}.supabase.co/storage/v1/upload/resumable`,
      retryDelays: [0, 1000, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${session.access_token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        "x-upsert": "true",
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: bucket,
        objectName: path,
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
      },
      chunkSize: 6 * 1024 * 1024, // 6 Mo — minimum imposé par Supabase Storage
      onError: (error) => {
        setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: "error", error: String(error) } : t));
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        setTasks((prev) => prev.map((t) => {
          if (t.id !== taskId) return t;
          const now = Date.now();
          const dt = (now - t.lastTick.time) / 1000;
          const db = bytesUploaded - t.lastTick.bytes;
          const speed = dt > 0.2 ? db / dt : t.speed;
          return { ...t, bytesUploaded, bytesTotal, speed, lastTick: { time: now, bytes: bytesUploaded } };
        }));
      },
      onSuccess: () => {
        setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: "success", bytesUploaded: t.bytesTotal } : t));
        onUploaded({ bucket, path, fileName: file.name, mimeType: file.type, sizeBytes: file.size });
      },
    });

    setTasks((prev) => [
      ...prev,
      { id: taskId, file, upload, bytesUploaded: 0, bytesTotal: file.size, speed: 0, status: "uploading", lastTick: { time: Date.now(), bytes: 0 } },
    ]);

    const previousUploads = await upload.findPreviousUploads();
    if (previousUploads.length) upload.resumeFromPreviousUpload(previousUploads[0]);
    upload.start();
  }, [accept, moduleId, pathPrefix, onUploaded, supabase]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => startUpload(f));
  }, [startUpload]);

  function pauseTask(task: UploadTask) {
    task.upload.abort();
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: "paused" } : t));
  }
  function resumeTask(task: UploadTask) {
    task.upload.start();
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: "uploading" } : t));
  }
  function retryTask(task: UploadTask) {
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: "uploading", error: undefined } : t));
    task.upload.start();
  }
  function removeTask(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl2 p-8 text-center cursor-pointer transition-colors ${
          dragOver ? "border-[var(--blue)] bg-blue-50 dark:bg-blue-500/10" : "border-[var(--line)] bg-[var(--bg-soft)]"
        }`}
      >
        <div className="text-3xl mb-2">📤</div>
        <p className="font-semibold text-sm">Glissez-déposez vos fichiers ici</p>
        <p className="text-xs text-[var(--gray)] mt-1">ou cliquez pour choisir un fichier depuis votre galerie / appareil</p>
        <input
          ref={inputRef}
          type="file"
          accept={acceptAttr}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {tasks.length > 0 && (
        <div className="mt-4 flex flex-col gap-3">
          {tasks.map((t) => {
            const pct = t.bytesTotal ? Math.round((t.bytesUploaded / t.bytesTotal) * 100) : 0;
            return (
              <div key={t.id} className="border border-[var(--line)] rounded-xl p-3.5 bg-white dark:bg-[#0B1016]">
                <div className="flex justify-between items-center mb-2 gap-2">
                  <span className="text-xs font-semibold truncate">{t.file.name}</span>
                  <span className="text-xs text-[var(--gray)] flex-shrink-0">{formatBytes(t.bytesTotal)}</span>
                </div>
                <ProgressBar pct={pct} sm />
                <div className="flex justify-between items-center mt-2 text-[11px] text-[var(--gray)]">
                  <span>
                    {t.status === "success" && "✅ Upload terminé"}
                    {t.status === "uploading" && `${pct}% · ${formatBytes(t.speed)}/s · reste ${estimateTimeRemaining(t.bytesUploaded, t.bytesTotal, t.speed)}`}
                    {t.status === "paused" && `⏸️ En pause · ${pct}%`}
                    {t.status === "error" && `⚠️ Erreur d'upload`}
                  </span>
                  <span className="flex gap-2">
                    {t.status === "uploading" && <button onClick={() => pauseTask(t)} className="underline">Pause</button>}
                    {t.status === "paused" && <button onClick={() => resumeTask(t)} className="underline">Reprendre</button>}
                    {t.status === "error" && <button onClick={() => retryTask(t)} className="underline">Réessayer</button>}
                    {(t.status === "success" || t.status === "error") && <button onClick={() => removeTask(t.id)} className="underline">Retirer</button>}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
