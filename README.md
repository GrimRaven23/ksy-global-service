# KSY Global Service

Système de gestion documentaire pour **KSY GLOBAL SERVICE** — Factures Pro Forma, Factures Définitives et Bons de Livraison.

## Fonctionnalités

- **Factures Pro Forma** — Création, impression, finalisation
- **Factures Définitives** — Création, impression, mode Livraison avec création automatique de BL
- **Bons de Livraison** — Création, impression 1 ou 2 exemplaires (Client + KSY)
- **Tableau de bord** — Vue d'ensemble des documents récents
- **Journal d'audit** — Traçabilité complète de toutes les actions
- **Gestion des utilisateurs** — 7 rôles avec permissions granulaires
- **Paramètres entreprise** — Informations société, banque, TVA (auto-save)
- **Impression A4** — Templates premium avec en-tête/pied KSY, décorations, blocs signature
- **Authentification sécurisée** — Sessions HMAC-SHA256, cookies HttpOnly
- **RBAC** — 7 rôles, 26 permissions, vérification côté serveur

## Stack technique

| Technologie | Rôle |
|-------------|------|
| Next.js 15 (App Router) | Framework |
| React 19 | UI |
| TypeScript 5 | Typage statique |
| Tailwind CSS v4 | Styles |
| Prisma 6 | ORM |
| PostgreSQL (Supabase) | Base de données |
| Zod | Validation des entrées |
| Vercel | Hébergement |

## Prérequis

- **Node.js 18+** (recommandé: 20)
- **npm** (ou yarn/pnpm)
- **Compte Supabase** gratuit — [supabase.com](https://supabase.com)
- **Compte Vercel** gratuit — [vercel.com](https://vercel.com)
- **Compte GitHub** gratuit — [github.com](https://github.com)

---

## Installation locale (développement)

### 1. Cloner le projet

```bash
git clone https://github.com/GrimRaven23/ksy-global-service.git
cd ksy-global-service
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Créez le fichier `.env.local` à la racine du projet :

```bash
# Copier le modèle
cp .env.example .env.local
```

Ou créez-le manuellement avec :

```
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[MOT-DE-PASSE]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
SESSION_SECRET="generer-une-chaine-aleatoire-ici"
NODE_ENV="development"
```

**Générer un SESSION_SECRET sécurisé :**

```bash
# macOS / Linux
openssl rand -hex 32

# Windows (PowerShell)
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
```

### 4. Créer la base de données Supabase

1. Allez sur [supabase.com](https://supabase.com) et créez un compte
2. Cliquez **"New project"**
3. Nom : `ksy-global` (ou votre choix)
4. Mot de passe : choisissez un mot de passe fort et **notez-le**
5. Région : choisissez la plus proche (ex: `West Europe` ou `France Central`)
6. Attendez que le projet soit créé
7. Allez dans **Settings → Database → Connection string → URI**
8. Copiez l'URL et remplacez `[YOUR-PASSWORD]` par votre mot de passe

L'URL ressemble à :
```
postgresql://postgres.xxxxx:VOTRE-MOT-DE-PASSE@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

9. Collez cette URL dans `.env.local` pour `DATABASE_URL`

### 5. Initialiser la base de données

```bash
# Générer le client Prisma
npx prisma generate

# Pousser le schéma vers la base de données
npx prisma db push

# Créer les données par défaut (entreprise, séquences, utilisateur admin)
npm run db:seed
```

### 6. Lancer le serveur de développement

```bash
npm run dev
```

L'application est accessible sur **http://localhost:3000**

### 7. Connexion

Utilisez les identifiants par défaut :

| Champ | Valeur |
|-------|--------|
| Email | `admin@ksy-global.com` |
| Mot de passe | `Admin@12345` |

**Changez ce mot de passe immédiatement** après la première connexion via la page Paramètres ou en modifiant directement dans la base de données.

---

## Déploiement sur Vercel

### Étape 1 : Pousser le code sur GitHub

```bash
git add .
git commit -m "feat: initial deployment"
git push origin main
```

### Étape 2 : Connecter le repository à Vercel

1. Allez sur [vercel.com](https://vercel.com) et connectez votre compte GitHub
2. Cliquez **"Add New → Project"**
3. Sélectionnez le repository `ksy-global-service`
4. Vercel détecte automatiquement Next.js — gardez les paramètres par défaut

### Étape 3 : Configurer les variables d'environnement

Dans la page de configuration du projet Vercel, ajoutez ces variables :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | Votre URL Supabase (identique au `.env.local`) |
| `SESSION_SECRET` | La même valeur générée plus haut |
| `NODE_ENV` | `production` |

**Important** : Vercel masque automatiquement les variables contenant des secrets. Ne cochez pas "Plain" pour `SESSION_SECRET`.

### Étape 4 : Déployer

Cliquez **"Deploy"** et attendez 1-2 minutes.

Votre app sera accessible à :
```
https://ksy-global-service.vercel.app
```

### Étape 5 : Initialiser la production

Après le premier déploiement, lancez le seed en production :

```bash
# Option A : Via Vercel CLI
npx vercel env pull .env.production.local
npx prisma db push
npm run db:seed

# Option B : Directement en local avec la DATABASE_URL de production
DATABASE_URL="votre-url-production" npx prisma db push
DATABASE_URL="votre-url-production" npm run db:seed
```

### Étape 6 : Vérification

1. Ouvrez l'URL Vercel
2. Connectez-vous avec `admin@ksy-global.com`
3. Allez dans **Paramètres** et remplissez les informations de l'entreprise
4. Créez une **Facture Pro Forma** → testez l'aperçu et l'impression
5. Créez une **Facture Définitive** → testez le mode Livraison
6. Créez un **Bon de Livraison** → testez l'impression 2 exemplaires
7. Vérifiez le **Journal d'audit**

---

## Structure du projet

```
ksy-next/
├── prisma/
│   ├── schema.prisma          # Schéma de la base de données
│   └── seed.ts                # Script d'initialisation
├── public/
│   └── images/                # Logo, cachet
├── src/
│   ├── app/
│   │   ├── api/               # API routes (8 endpoints)
│   │   │   ├── auth/          # Login, logout, me
│   │   │   ├── documents/     # CRUD factures + create-bl
│   │   │   ├── delivery/      # CRUD bons de livraison
│   │   │   ├── settings/      # Paramètres entreprise
│   │   │   ├── users/         # Gestion utilisateurs
│   │   │   └── audit/         # Journal d'audit
│   │   ├── login/             # Page de connexion
│   │   ├── proforma/          # Éditeur facture pro forma
│   │   ├── definitive/        # Éditeur facture définitive
│   │   ├── bl/                # Éditeur bon de livraison
│   │   ├── documents/         # Liste des documents
│   │   ├── users/             # Gestion utilisateurs
│   │   ├── audit/             # Journal d'audit
│   │   ├── settings/          # Paramètres entreprise
│   │   ├── page.tsx           # Tableau de bord
│   │   ├── layout.tsx         # Layout principal
│   │   └── globals.css        # Styles globaux + print
│   ├── components/
│   │   ├── DocumentEditor.tsx # Éditeur factures (666 lignes)
│   │   ├── BLEditor.tsx       # Éditeur bon de livraison (529 lignes)
│   │   └── ui.tsx             # Composants UI partagés
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── session.ts     # Gestion des sessions
│   │   │   └── password.ts    # Hachage mots de passe
│   │   ├── services/
│   │   │   ├── documents.ts   # Logique métier factures
│   │   │   ├── delivery.ts    # Logique métier BL
│   │   │   ├── company.ts     # Paramètres entreprise
│   │   │   └── audit.ts       # Événements d'audit
│   │   ├── types.ts           # Types TypeScript + RBAC
│   │   ├── validation.ts      # Schémas Zod
│   │   ├── utils.ts           # Utilitaires (formatage, calculs)
│   │   ├── prisma.ts          # Client Prisma singleton
│   │   └── hooks.ts           # Hooks React custom
│   └── middleware.ts          # Middleware sécurité (sessions, headers)
├── .env.example               # Modèle de variables d'environnement
├── .gitignore
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json
├── DEPLOY.md                  # Guide de déploiement (FR)
└── IMPLEMENTATION-REPORT.md   # Rapport technique détaillé
```

---

## Commandes disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement (localhost:3000) |
| `npm run build` | Build de production |
| `npm run start` | Lancer la production en local |
| `npm run lint` | Vérifier le code avec ESLint |
| `npm run typecheck` | Vérifier les types TypeScript |
| `npx prisma generate` | Générer le client Prisma |
| `npx prisma db push` | Pousser le schéma vers la BDD |
| `npx prisma migrate dev` | Créer une migration |
| `npm run db:seed` | Initialiser les données par défaut |
| `npx prisma studio` | Interface graphique pour la BDD |

---

## Rôles et permissions

| Rôle | Description | Permissions |
|------|-------------|-------------|
| **OWNER** | Propriétaire | Accès complet (26 permissions) |
| **IT_ADMIN** | Admin technique | Gestion technique (14 permissions) |
| **ADMIN** | Admin business | Gestion métier (17 permissions) |
| **SALES** | Vente | CRUD documents + clients (12 permissions) |
| **ASSISTANT** | Assistant | Documents limités (9 permissions) |
| **DELIVERY** | Livreur | Livraison + lecture (5 permissions) |
| **VIEWER** | Lecteur | Lecture seule (4 permissions) |

---

## Dépannage

| Problème | Solution |
|----------|----------|
| Build échoue | Vérifiez que `DATABASE_URL` et `SESSION_SECRET` sont définis |
| Erreur "SESSION_SECRET not configured" | Ajoutez `SESSION_SECRET` dans les variables d'environnement |
| Erreur de connexion BDD | Vérifiez que l'IP est autorisée dans Supabase (Settings → Network) |
| Page blanche après login | Vérifiez les logs Vercel pour une erreur 503 |
| Prisma generate échoue | `npx prisma validate` pour vérifier le schéma |
| Build Vercel échoue | Vérifiez que le build inclut `npx prisma generate` (dans vercel.json) |
| "Chargement..." infini | Problème d'auth — vérifiez que le middleware fonctionne |
| Les documents ne se chargent pas | Vérifiez que `DATABASE_URL` pointe vers la bonne base |

---

## Sécurité

- **Authentification** : Sessions HMAC-SHA256, cookies HttpOnly, expiration 8h
- **Autorisation** : RBAC 7 rôles, 26 permissions, vérifié sur chaque API
- **Validation** : Schémas Zod sur toutes les entrées
- **Headers** : CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- **Mots de passe** : PBKDF2, 100k itérations, sel aléatoire, SHA-512
- **Audit** : Traçabilité complète de toutes les actions
- **Secrets** : Variables d'environnement, `.env` exclu du git

---

## Licence

Projet privé — KSY Global Service.
