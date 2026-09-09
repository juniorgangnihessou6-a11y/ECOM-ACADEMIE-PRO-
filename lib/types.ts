export type UserRole = "admin" | "student" | "coach" | "moderator" | "assistant";
export type AccountStatus = "active" | "suspended" | "expired";
export type ContentType = "video" | "document" | "link" | "quiz";
export type FileKind = "video" | "image" | "document" | "other";

export interface Profile {
  id: string;
  role: UserRole;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  avatar_url: string | null;
  statut: AccountStatus;
  access_start: string | null;
  access_end: string | null;
  date_inscription: string;
  last_login: string | null;
}

export interface ModuleRow {
  id: string;
  numero: number;
  nom: string;
  description: string;
  cover_url: string | null;
  statut: string;
  ordre: number;
}

export interface LessonRow {
  id: string;
  module_id: string;
  type: ContentType;
  numero: number;
  titre: string;
  description: string;
  file_id: string | null;
  duree_secondes: number | null;
  url: string | null;
  quiz_id: string | null;
  statut: string;
  ordre: number;
}

export interface FileRow {
  id: string;
  kind: FileKind;
  nom_original: string;
  storage_bucket: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  duree_secondes: number | null;
  module_id: string | null;
  created_at: string;
}

export interface QuizRow {
  id: string;
  module_id: string | null;
  titre: string;
}

export interface QuizQuestionRow {
  id: string;
  quiz_id: string;
  ordre: number;
  question: string;
  explication: string;
}

export interface QuizAnswerRow {
  id: string;
  question_id: string;
  ordre: number;
  texte: string;
  est_correcte?: boolean; // only present when fetched by admin / server route
}

export interface ProgressRow {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
}

export interface ResourceRow {
  id: string;
  module_id: string | null;
  nom: string;
  description: string;
  type: string;
  file_id: string | null;
  url: string | null;
}

export interface AnnouncementRow {
  id: string;
  titre: string;
  message: string;
  type: "information" | "nouveaute" | "rappel" | "urgent";
  created_at: string;
}

export interface SettingsRow {
  id: number;
  platform_name: string;
  description: string;
  logo_url: string | null;
  favicon_url: string | null;
  cover_url: string | null;
  theme: string;
  primary_color: string;
}
