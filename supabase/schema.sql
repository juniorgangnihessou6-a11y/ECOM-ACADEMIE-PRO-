-- =============================================================================
-- ECOM ACADÉMIE PRO — Database schema (PostgreSQL / Supabase)
-- =============================================================================
-- Run this whole file once in the Supabase SQL editor (Project > SQL Editor > New query)
-- after creating your Supabase project. It creates all tables, indexes,
-- Row Level Security (RLS) policies, and a trigger that auto-creates a
-- `profiles` row whenever someone signs up via Supabase Auth.
-- =============================================================================

-- ---------- EXTENSIONS ----------
create extension if not exists "uuid-ossp";

-- ---------- ENUM TYPES ----------
create type user_role as enum ('admin', 'student', 'coach', 'moderator', 'assistant');
create type account_status as enum ('active', 'suspended', 'expired');
create type content_type as enum ('video', 'document', 'link', 'quiz');
create type file_kind as enum ('video', 'image', 'document', 'other');
create type announcement_type as enum ('information', 'nouveaute', 'rappel', 'urgent');

-- =============================================================================
-- PROFILES  (extends Supabase auth.users with app-specific fields)
-- =============================================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'student',
  prenom text not null default '',
  nom text not null default '',
  email text,
  telephone text,
  avatar_url text,
  statut account_status not null default 'active',
  access_start date,
  access_end date,
  date_inscription timestamptz not null default now(),
  last_login timestamptz,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user signs up.
create function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'student');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- =============================================================================
-- MODULES
-- =============================================================================
create table modules (
  id uuid primary key default uuid_generate_v4(),
  numero int not null,
  nom text not null,
  description text default '',
  cover_url text,
  statut text not null default 'publie', -- 'publie' | 'brouillon'
  ordre int not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- =============================================================================
-- LESSONS  (a lesson is one item inside a module's content list:
-- a video, a document, a link, or a quiz reference — matches the
-- "module contains an ordered mix of content types" requirement)
-- =============================================================================
create table lessons (
  id uuid primary key default uuid_generate_v4(),
  module_id uuid not null references modules(id) on delete cascade,
  type content_type not null,
  numero int not null,
  titre text not null,
  description text default '',
  -- for type = 'video'
  file_id uuid, -- references files(id), set after upload completes
  duree_secondes int,
  -- for type = 'document' / 'link'
  url text,
  -- for type = 'quiz'
  quiz_id uuid, -- references quizzes(id)
  statut text not null default 'publie',
  ordre int not null default 0,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- FILES  (metadata only — the actual bytes live in Supabase Storage, never
-- in the database, per the brief's requirement to keep storage separate)
-- =============================================================================
create table files (
  id uuid primary key default uuid_generate_v4(),
  kind file_kind not null,
  nom_original text not null,
  storage_bucket text not null,       -- e.g. 'videos', 'documents', 'images'
  storage_path text not null,         -- path inside the bucket
  mime_type text,
  size_bytes bigint,
  duree_secondes int,                 -- for videos, filled in client-side after upload
  module_id uuid references modules(id) on delete set null,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table lessons
  add constraint lessons_file_fk foreign key (file_id) references files(id) on delete set null;

-- =============================================================================
-- QUIZZES / QUESTIONS / ANSWERS
-- =============================================================================
create table quizzes (
  id uuid primary key default uuid_generate_v4(),
  module_id uuid references modules(id) on delete cascade,
  titre text not null,
  created_at timestamptz not null default now()
);

create table quiz_questions (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  ordre int not null default 0,
  question text not null,
  explication text default ''
);

create table quiz_answers (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid not null references quiz_questions(id) on delete cascade,
  ordre int not null default 0,
  texte text not null,
  est_correcte boolean not null default false
);

alter table lessons
  add constraint lessons_quiz_fk foreign key (quiz_id) references quizzes(id) on delete set null;

create table quiz_attempts (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  score int not null,
  total int not null,
  answers jsonb not null default '{}', -- { question_id: chosen_answer_id }
  created_at timestamptz not null default now()
);

-- =============================================================================
-- PROGRESS  (one row per student per lesson watched/completed)
-- =============================================================================
create table progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

-- =============================================================================
-- ENROLLMENTS  (which students can access which modules — supports the
-- "activer/désactiver l'accès, date de début/fin" requirement per student.
-- If a student has no row for a module, default policy = full catalog access;
-- add rows here only when you need to restrict/expire access individually.)
-- =============================================================================
create table enrollments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  module_id uuid not null references modules(id) on delete cascade,
  access_start date default now(),
  access_end date,
  created_at timestamptz not null default now(),
  unique (user_id, module_id)
);

-- =============================================================================
-- RESOURCES  (PDFs, templates, checklists, links attached to a module)
-- =============================================================================
create table resources (
  id uuid primary key default uuid_generate_v4(),
  module_id uuid references modules(id) on delete set null,
  nom text not null,
  description text default '',
  type text not null default 'lien', -- 'pdf' | 'document' | 'lien' | 'outil'
  file_id uuid references files(id) on delete set null,
  url text,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- ANNOUNCEMENTS
-- =============================================================================
create table announcements (
  id uuid primary key default uuid_generate_v4(),
  titre text not null,
  message text not null,
  type announcement_type not null default 'information',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- =============================================================================
-- CERTIFICATES
-- =============================================================================
create table certificates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  numero text not null unique,
  delivre_le date not null default now(),
  created_at timestamptz not null default now()
);

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade, -- null = broadcast to admins
  texte text not null,
  lu boolean not null default false,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- SETTINGS  (single-row table for platform-wide configuration)
-- =============================================================================
create table settings (
  id int primary key default 1,
  platform_name text not null default 'Ecom Académie Pro',
  description text default '',
  logo_url text,
  favicon_url text,
  cover_url text,
  theme text not null default 'light',
  primary_color text not null default '#1E63E9',
  constraint singleton check (id = 1)
);
insert into settings (id) values (1);

-- =============================================================================
-- INDEXES
-- =============================================================================
create index idx_lessons_module on lessons(module_id);
create index idx_files_module on files(module_id);
create index idx_progress_user on progress(user_id);
create index idx_progress_lesson on progress(lesson_id);
create index idx_enrollments_user on enrollments(user_id);
create index idx_quiz_questions_quiz on quiz_questions(quiz_id);
create index idx_quiz_answers_question on quiz_answers(question_id);
create index idx_notifications_user on notifications(user_id);

-- =============================================================================
-- HELPER FUNCTION — is the current user an admin?
-- =============================================================================
create function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
alter table profiles enable row level security;
alter table modules enable row level security;
alter table lessons enable row level security;
alter table files enable row level security;
alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_answers enable row level security;
alter table quiz_attempts enable row level security;
alter table progress enable row level security;
alter table enrollments enable row level security;
alter table resources enable row level security;
alter table announcements enable row level security;
alter table certificates enable row level security;
alter table notifications enable row level security;
alter table settings enable row level security;

-- ---- profiles ----
create policy "Users can view their own profile" on profiles for select using (id = auth.uid());
create policy "Admins can view all profiles" on profiles for select using (is_admin());
create policy "Users can update their own profile" on profiles for update using (id = auth.uid());
create policy "Admins can manage all profiles" on profiles for all using (is_admin());

-- ---- modules ----
create policy "Everyone signed in can view published modules" on modules
  for select using (auth.uid() is not null and (statut = 'publie' or is_admin()));
create policy "Admins manage modules" on modules for all using (is_admin());

-- ---- lessons ----
create policy "Signed-in users can view published lessons" on lessons
  for select using (auth.uid() is not null and (statut = 'publie' or is_admin()));
create policy "Admins manage lessons" on lessons for all using (is_admin());

-- ---- files ----
-- Metadata is readable by any signed-in user (actual bytes are protected
-- separately by Storage policies + signed URLs — see README).
create policy "Signed-in users can view file metadata" on files
  for select using (auth.uid() is not null);
create policy "Admins manage files" on files for all using (is_admin());

-- ---- quizzes / questions / answers ----
create policy "Signed-in users can view quizzes" on quizzes for select using (auth.uid() is not null);
create policy "Admins manage quizzes" on quizzes for all using (is_admin());
create policy "Signed-in users can view questions" on quiz_questions for select using (auth.uid() is not null);
create policy "Admins manage questions" on quiz_questions for all using (is_admin());
-- Students must NOT see which answer is correct ahead of time in a naive
-- select *, so the app only ever requests `id, texte` client-side for
-- quiz-taking, and uses a server route (service role) to grade attempts.
create policy "Signed-in users can view answers" on quiz_answers for select using (auth.uid() is not null);
create policy "Admins manage answers" on quiz_answers for all using (is_admin());

-- ---- quiz_attempts ----
create policy "Users see their own attempts" on quiz_attempts for select using (user_id = auth.uid() or is_admin());
create policy "Users insert their own attempts" on quiz_attempts for insert with check (user_id = auth.uid());
create policy "Admins manage attempts" on quiz_attempts for all using (is_admin());

-- ---- progress ----
create policy "Users see their own progress" on progress for select using (user_id = auth.uid() or is_admin());
create policy "Users upsert their own progress" on progress for insert with check (user_id = auth.uid());
create policy "Users update their own progress" on progress for update using (user_id = auth.uid());
create policy "Admins manage progress" on progress for all using (is_admin());

-- ---- enrollments ----
create policy "Users see their own enrollments" on enrollments for select using (user_id = auth.uid() or is_admin());
create policy "Admins manage enrollments" on enrollments for all using (is_admin());

-- ---- resources ----
create policy "Signed-in users can view resources" on resources for select using (auth.uid() is not null);
create policy "Admins manage resources" on resources for all using (is_admin());

-- ---- announcements ----
create policy "Signed-in users can view announcements" on announcements for select using (auth.uid() is not null);
create policy "Admins manage announcements" on announcements for all using (is_admin());

-- ---- certificates ----
create policy "Users see their own certificate" on certificates for select using (user_id = auth.uid() or is_admin());
create policy "Admins manage certificates" on certificates for all using (is_admin());

-- ---- notifications ----
create policy "Users see their own or broadcast notifications" on notifications
  for select using (user_id = auth.uid() or user_id is null or is_admin());
create policy "Admins manage notifications" on notifications for all using (is_admin());

-- ---- settings ----
create policy "Everyone signed in can read settings" on settings for select using (auth.uid() is not null);
create policy "Admins manage settings" on settings for all using (is_admin());

-- =============================================================================
-- SEED: turn your first Supabase Auth user into an admin
-- =============================================================================
-- After you sign up your own account once through the app's /login ->
-- "create account" flow (or via the Supabase dashboard), run this manually
-- with your real email, ONE TIME, to promote yourself to admin:
--
--   update profiles set role = 'admin' where email = 'toi@example.com';
--
-- =============================================================================
