# KSY Global Service — Guide de déploiement

## Prérequis
- Node.js 18+ installé
- Compte GitHub (gratuit)
- Compte Vercel (gratuit — vercel.com)
- Compte Supabase (gratuit — supabase.com)

---

## Étape 1 : Créer la base de données Supabase

1. Allez sur **https://supabase.com** et créez un compte gratuit
2. Cliquez **"New project"**
3. Choisissez un nom (ex: `ksy-global`) et un mot de passe fort
4. Sélectionnez la région la plus proche (Europe: `West Europe` ou `France Central`)
5. Notez le **mot de passe** — vous en aurez besoin
6. Une fois le projet créé, allez dans **Settings → Database**
7. Dans **Connection string → URI**, copiez l'URL
8. Remplacez `[YOUR-PASSWORD]` par votre mot de passe

L'URL ressemble à :
```
postgresql://postgres.xxxxx:[VOTRE-MOT-DE-PASSE]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

---

## Étape 2 : Générer un SESSION_SECRET

Le `SESSION_SECRET` est **obligatoire** — sans lui, l'application refuse l'accès en production.

**macOS / Linux :**
```bash
openssl rand -hex 32
```

**Windows (PowerShell) :**
```powershell
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
```

Copiez le résultat — vous en aurez besoin à l'étape 3 et 5.

---

## Étape 3 : Configurer le projet localement

```bash
# 1. Aller dans le dossier du projet
cd ksy-global-service

# 2. Installer les dépendances
npm install
```

Créez le fichier `.env.local` à la racine du projet :

```
DATABASE_URL="postgresql://postgres.xxxxx:[MOT-DE-PASSE]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
SESSION_SECRET="votre-chaine-generee-a-letape-2"
NODE_ENV="development"
```

```bash
# 3. Générer le client Prisma
npx prisma generate

# 4. Pousser le schéma vers la base de données
npx prisma db push

# 5. Initialiser les données par défaut
npm run db:seed

# 6. Lancer le serveur de développement
npm run dev
```

L'app tourne sur **http://localhost:3000**

Identifiants par défaut :
- Email : `admin@ksy-global.com`
- Mot de passe : `Admin@12345`

---

## Étape 4 : Pousser le code sur GitHub

```bash
# 1. Initialiser Git (si ce n'est pas déjà fait)
git init
git add .
git commit -m "feat: initial KSY Global Service"

# 2. Créer un repository sur GitHub
#    - Allez sur https://github.com/new
#    - Nom: ksy-global-service
#    - Ne cochez PAS "Add a README" (on en a déjà un)
#    - Cliquez "Create repository"

# 3. Pousser le code
git remote add origin https://github.com/VOTRE-UTILISATEUR/ksy-global-service.git
git branch -M main
git push -u origin main
```

---

## Étape 5 : Déployer sur Vercel

1. Allez sur **https://vercel.com** et connectez votre compte GitHub
2. Cliquez **"Add New → Project"**
3. Sélectionnez le repository **ksy-global-service**
4. Vercel détecte automatiquement Next.js — les settings par défaut sont OK
5. **Important** : Ajoutez les variables d'environnement :
   - Cliquez sur **"Environment Variables"**
   - Ajoutez ces 3 variables :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | Votre URL Supabase (identique au `.env.local`) |
| `SESSION_SECRET` | La même valeur générée à l'étape 2 |
| `NODE_ENV` | `production` |

6. Cliquez **"Deploy"**

Attendez 1-2 minutes que le build se termine. Votre app sera accessible à l'URL :
```
https://ksy-global-service.vercel.app
```

---

## Étape 6 : Initialiser la production

Après le premier déploiement, initialisez la base de données de production :

```bash
# Installer Vercel CLI (une seule fois)
npm i -g vercel

# Se connecter à Vercel
vercel login

# Tirer les variables d'environnement de production
vercel env pull .env.production.local

# Initialiser la base de données avec les variables de production
source .env.production.local
npx prisma generate
npx prisma db push
npm run db:seed
```

---

## Étape 7 : Vérification

1. Ouvrez l'URL Vercel
2. Connectez-vous avec `admin@ksy-global.com` / `Admin@12345`
3. Allez dans **Paramètres** et remplissez les informations de l'entreprise
4. Créez une **Facture Pro Forma** — vérifiez l'aperçu et l'impression
5. Créez une **Facture Définitive** — testez le mode "Livraison"
6. Créez un **Bon de Livraison** — testez l'impression 2 exemplaires
7. Vérifiez le **Journal d'audit** — toutes les actions doivent y apparaître

---

## Commandes utiles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement local |
| `npm run build` | Build de production |
| `npm run start` | Lancer la production en local |
| `npm run lint` | Vérifier le code (ESLint) |
| `npm run typecheck` | Vérifier les types TypeScript |
| `npx prisma generate` | Générer le client Prisma |
| `npx prisma db push` | Pousser les changements de schéma |
| `npx prisma migrate dev` | Créer une migration |
| `npm run db:seed` | Initialiser les données par défaut |
| `npx prisma studio` | Interface graphique pour la BDD |

---

## Dépannage

**Build Vercel échoue**
→ Vérifiez que `DATABASE_URL` et `SESSION_SECRET` sont bien définis dans les Environment Variables

**Erreur "SESSION_SECRET not configured" (503)**
→ Le `SESSION_SECRET` n'est pas défini. Ajoutez-le dans les variables d'environnement Vercel

**Erreur de connexion à la BDD**
→ Vérifiez que l'IP de Vercel est autorisée dans Supabase (Settings → Database → Network restrictions)

**Page blanche après le login**
→ Vérifiez les logs Vercel pour une erreur 503 ou 500

**"Chargement..." infini sur les pages documents**
→ Problème d'authentification — vérifiez que SESSION_SECRET est configuré

**Prisma generate échoue**
→ Vérifiez que le schéma Prisma est valide : `npx prisma validate`

**Images manquantes**
→ Les images dans `public/images/` sont copiées automatiquement lors du build
