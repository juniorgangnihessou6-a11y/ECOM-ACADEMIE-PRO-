export function formatBytes(bytes: number): string {
  if (!bytes) return "0 o";
  const units = ["o", "Ko", "Mo", "Go"];
  let i = 0;
  let value = bytes;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return value.toFixed(i === 0 ? 0 : 1) + " " + units[i];
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m + ":" + String(s).padStart(2, "0");
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function initials(prenom?: string | null, nom?: string | null): string {
  const a = (prenom || "?").trim()[0] || "?";
  const b = (nom || "").trim()[0] || "";
  return (a + b).toUpperCase();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function estimateTimeRemaining(bytesUploaded: number, bytesTotal: number, bytesPerSecond: number): string {
  if (bytesPerSecond <= 0) return "calcul en cours…";
  const remainingSeconds = (bytesTotal - bytesUploaded) / bytesPerSecond;
  if (remainingSeconds < 60) return Math.ceil(remainingSeconds) + " s";
  const minutes = Math.ceil(remainingSeconds / 60);
  return minutes + " min";
}
