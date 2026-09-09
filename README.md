# ECOM ACADÉMIE PRO

Plateforme de formation e-commerce complète — Next.js (App Router) + Supabase
(authentification, base de données PostgreSQL, stockage de fichiers).

Ce n'est **pas** une maquette : les élèves, modules, vidéos, quiz, progression
et annonces sont de vraies tables en base de données, avec de vraies règles de
sécurité (Row Level Security), et l'upload de fichiers se fait directement du
navigateur vers le stockage cloud (pas de limite artificielle de taille dans
le code).

---

## 1. Stack technique et pourquoi

| Brique | Choix | Pourquoi |
|---|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS | Rendu serveur rapide, SEO correct sur la page publique, écosystème mûr, déploiement Vercel en un clic |
| Auth | Supabase Auth | Gère les comptes, sessions, mots de passe oubliés, sans avoir à coder un système d'authentification maison |
| Base de données | Supabase (PostgreSQL managé) | Vraie base relationnelle, Row Level Security native (sécurité au niveau ligne, appliquée même si quelqu'un contourne le frontend) |
| Stockage fichiers | Supabase Storage | Séparé de la base de données (les vidéos ne sont jamais stockées en base), upload résumable par blocs (TUS), URLs signées à durée limitée pour la lecture protégée |
| Upload gros fichiers | `tus-js-client` (protocole TUS) | Upload direct navigateur → stockage, par blocs de 6 Mo, avec reprise automatique après coupure réseau, pause/reprise manuelle, retries automatiques |
| Graphiques | `recharts` | Graphiques statistiques modernes sans réinventer un moteur de rendu |

**Pourquoi pas de limite artificielle de taille de fichier dans le code ?**
Parce que l'upload part directement du navigateur vers Supabase Storage — il
ne passe jamais par une route API Next.js, donc aucune limite de taille de
requête serveur ne s'applique. La seule vraie limite est celle de ton plan
Supabase (voir section 4).

---

## 2. Structure du projet

```
ecom-academie-pro/
├── app/
│   ├── page.tsx                    → Page publique (landing)
│   ├── login/page.tsx              → Connexion
│   ├── admin/                      → Espace admin (protégé par middleware.ts)
│   │   ├── page.tsx                → Dashboard
│   │   ├── students/               → Gestion des élèves
│   │   ├── modules/                → Gestion des modules + contenu (vidéos/docs/liens/quiz)
│   │   ├── library/                → Bibliothèque média (tous les fichiers importés)
│   │   ├── quizzes/                → Constructeur de quiz
│   │   ├── announcements/          → Annonces
│   │   ├── resources/              → Ressources
│   │   ├── stats/                  → Statistiques + graphiques
│   │   └── settings/               → Paramètres de la plateforme
│   ├── student/                    → Espace élève (protégé par middleware.ts)
│   │   ├── page.tsx                → Dashboard élève
│   │   ├── modules/                → Mes modules
│   │   ├── lesson/[id]/            → Lecteur (vidéo/document/lien) + playlist
│   │   ├── quiz/[id]/              → Passer un quiz
│   │   ├── certificate/            → Certificat (débloqué à 100%)
│   │   └── profile/                → Profil élève
│   └── api/
│       ├── admin/students/         → Création/modification/suppression de comptes élèves (service role)
│       ├── media/signed-url/       → Génère une URL signée à durée limitée pour lire une vidéo/document privé
│       ├── progress/               → Marque une leçon comme terminée
│       └── quiz/submit/            → Corrige un quiz côté serveur (les bonnes réponses ne sont jamais envoyées au navigateur avant validation)
├── components/                     → Composants réutilisables (UI, sidebar, uploader, lecteur vidéo…)
├── lib/supabase/                   → Clients Supabase (navigateur / serveur / admin)
├── middleware.ts                   → Protège /admin et /student selon le rôle
├── supabase/
│   ├── schema.sql                  → Tout le schéma de base de données + RLS
│   └── storage.sql                 → Buckets de stockage + règles de sécurité
└── scripts/seed.mjs                → Crée les comptes et données de démonstration
```

---

## 3. Installation — étape par étape

### 3.1 Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) → *New project*.
2. Choisis un nom, un mot de passe de base de données (garde-le précieusement), une région proche de tes élèves.
3. Attends ~2 minutes que le projet soit prêt.

### 3.2 Créer le schéma de base de données

1. Dans le tableau de bord Supabase → **SQL Editor** → *New query*.
2. Colle tout le contenu de `supabase/schema.sql`, exécute (*Run*).
3. Nouvelle requête → colle tout le contenu de `supabase/storage.sql`, exécute.

### 3.3 Récupérer tes clés API

Dans **Project Settings → API** :
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ secret, ne jamais exposer au navigateur)

Dans **Project Settings → General**, la "Reference ID" du projet →
`NEXT_PUBLIC_SUPABASE_PROJECT_REF` (c'est le `xxxxxxxxxxxx` dans
`https://xxxxxxxxxxxx.supabase.co`).

### 3.4 Configurer le projet en local

```bash
cp .env.example .env.local
# remplis .env.local avec les 4 valeurs ci-dessus
npm install
```

### 3.5 Créer tes données de démonstration (optionnel mais recommandé)

```bash
node --env-file=.env.local scripts/seed.mjs
```

Cela crée :
- Admin : `admin@ecomacademiepro.com` / `admin123`
- Élève : `alex.koffi@example.com` / `eleve123`
- Élève : `sarah.mensah@example.com` / `eleve123`
- Élève : `david.ahoua@example.com` / `eleve123`
- 10 modules, quelques leçons de démonstration (liens), un quiz, des annonces et ressources.

⚠️ Change ces mots de passe (ou supprime ces comptes) avant d'inviter de vrais élèves.

### 3.6 Lancer en local

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

---

## 4. Limites de taille de fichier — ce qu'il faut savoir

Il n'y a **aucune limite codée en dur** dans cette application. La seule
limite vient de ton plan Supabase :

- **Plan gratuit** : 1 Go de stockage total, upload jusqu'à 50 Mo par fichier par défaut.
- **Plans payants (Pro et au-dessus)** : jusqu'à plusieurs Go par fichier, configurable dans **Project Settings → Storage → Upload file size limit**.

Pour des vidéos de formation longues, prévois un plan payant Supabase (à
partir de 25$/mois) qui permet des uploads bien plus volumineux et plus de
stockage. C'est indiqué clairement dans ton tableau de bord Supabase, pas
une limite cachée de ce code.

---

## 5. Sécurité — comment les vidéos sont protégées

1. Les fichiers vidéo/document sont stockés dans des **buckets privés**
   (`videos`, `documents`) — impossible d'y accéder par une URL directe.
2. Seuls les comptes admin peuvent y écrire (règles RLS sur `storage.objects`).
3. Pour qu'un élève regarde une vidéo, le lecteur appelle la route
   `/api/media/signed-url`, qui :
   - vérifie que l'élève est connecté et non suspendu,
   - vérifie ses dates d'accès (`access_start` / `access_end`) si définies,
   - vérifie que la leçon est bien publiée,
   - puis génère une **URL signée valable 5 minutes** avec la clé `service_role`.
4. Cette URL expire donc rapidement — elle ne peut pas être partagée
   indéfiniment comme un lien public classique.

**Limite honnête à connaître** : comme précisé dans la demande d'origine,
aucune vidéo diffusée à un navigateur ne peut être protégée à 100 % contre
l'enregistrement d'écran. Cette architecture empêche le partage de lien
direct et l'accès non autorisé, ce qui est déjà largement au-dessus de ce
qu'offre une simple URL publique.

---

## 6. Déploiement en production (Vercel)

1. Pousse ce projet sur un dépôt GitHub.
2. Va sur [vercel.com](https://vercel.com) → *New Project* → importe ton dépôt.
3. Dans les paramètres du projet Vercel → **Environment Variables**, ajoute les 4 mêmes variables que dans `.env.local`.
4. Déploie. Vercel te donne une URL du type `https://ton-projet.vercel.app`.
5. (Optionnel) Ajoute ton propre nom de domaine dans **Vercel → Settings → Domains**.
6. Dans Supabase → **Authentication → URL Configuration**, ajoute l'URL de ton site déployé dans *Site URL* et *Redirect URLs* (nécessaire pour que "mot de passe oublié" fonctionne).

---

## 7. Devenir admin / promouvoir un compte

Après avoir créé ton propre compte (via le script de seed, ou en créant un
élève puis en le promouvant), tu peux promouvoir n'importe quel compte en
admin directement en base :

```sql
update profiles set role = 'admin' where email = 'toi@example.com';
```

---

## 8. Ce qui est livré vs feuille de route

**✅ Complet et fonctionnel dans cette version :**
Authentification réelle, gestion des élèves (CRUD + accès temporel +
suspension), modules avec contenu mixte (vidéo/document/lien/quiz),
upload résumable par blocs avec progression/vitesse/temps restant/pause/
reprise, bibliothèque média avec recherche/filtre/tri/renommer/supprimer,
lecteur vidéo protégé par URL signée, playlist à déblocage séquentiel,
progression individuelle par élève, quiz corrigés côté serveur, certificat
imprimable, annonces, ressources, statistiques avec graphiques, recherche
admin, paramètres, responsive mobile complet, mode clair/sombre.

**🚧 Pistes d'évolution pour la suite** (non bloquantes pour un lancement,
mais à prévoir si la plateforme grandit) :
- Notifications temps réel (actuellement pas de flux temps réel type WebSocket).
- Rôles coach/modérateur/assistant : la colonne existe déjà en base (`user_role`), l'interface de gestion fine des permissions par rôle reste à construire.
- Transcodage vidéo automatique (compression, plusieurs résolutions) — actuellement la vidéo est servie telle qu'importée.
- Emails transactionnels personnalisés (bienvenue, rappels) — Supabase Auth envoie déjà l'email de réinitialisation de mot de passe nativement.

---

## 9. Commandes utiles

```bash
npm run dev      # développement local
npm run build    # build de production (à lancer avant de déployer, pour détecter les erreurs)
npm run start    # lance le build de production en local
```
