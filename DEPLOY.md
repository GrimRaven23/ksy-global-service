# KSY Global Service — Guide de déploiement Vercel

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
postgresql://postgres.xxxxx:[VOTRE-MOT-DE-PASSE]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

---

## Étape 2 : Configurer le projet localement

```bash
# 1. Aller dans le dossier du projet
cd ksy-next

# 2. Créer le fichier .env avec vos identifiants
# (remplacez la valeur DATABASE_URL par votre URL Supabase)
```

Créez le fichier `.env` à la racine du projet :
```
DATABASE_URL="postgresql://postgres.xxxxx:[MOT-DE-PASSE]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
```

```bash
# 3. Installer les dépendances
npm install

# 4. Générer le client Prisma
npx prisma generate

# 5. Pousser le schéma vers la base de données
npx prisma db push

# 6. Initialiser les données par défaut
npm run db:seed

# 7. Lancer le serveur de développement
npm run dev
```

L'app tourne sur **http://localhost:3000**

---

## Étape 3 : Pousser le code sur GitHub

```bash
# 1. Initialiser Git (si ce n'est pas déjà fait)
git init
git add .
git commit -m "Initial commit: KSY Global Service"

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

## Étape 4 : Déployer sur Vercel

1. Allez sur **https://vercel.com** et connectez votre compte GitHub
2. Cliquez **"Add New → Project"**
3. Sélectionnez le repository **ksy-global-service**
4. Vercel détecte automatiquement Next.js — les settings par défaut sont OK
5. **Important** : Ajoutez la variable d'environnement :
   - Cliquez sur **"Environment Variables"**
   - Nom : `DATABASE_URL`
   - Valeur : votre URL Supabase (identique au `.env`)
   - Cliquez **"Add"**
6. Cliquez **"Deploy"**

Attendez 1-2 minutes que le build se termine. Votre app sera accessible à l'URL :
```
https://ksy-global-service.vercel.app
```

---

## Étape 5 : Vérification

1. Ouvrez l'URL Vercel
2. Allez dans **Paramètres** et remplissez les informations de l'entreprise
3. Créez une **Facture Pro Forma** — vérifiez l'aperçu et l'impression
4. Créez une **Facture Définitive** — testez le mode "Livraison"
5. Créez un **Bon de Livraison** — testez l'impression 2 exemplaires
6. Vérifiez le **Journal d'audit** — toutes les actions doivent y apparaître
7. Vérifiez **Tous les documents** — la liste doit se peupler

---

## Commandes utiles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement local |
| `npm run build` | Build de production |
| `npm run start` | Lancer la production en local |
| `npx prisma studio` | Interface graphique pour la BDD |
| `npx prisma db push` | Pousser les changements de schéma |
| `npm run db:seed` | Réinitialiser les données par défaut |

---

## Dépannage

**Build Vercel échoue** → Vérifiez que `DATABASE_URL` est bien défini dans les Environment Variables de Vercel

**Erreur de connexion à la BDD** → Vérifiez que l'IP de Vercel est autorisée dans Supabase (Settings → Database → Network restrictions)

**Images manquantes** → Les images dans `public/images/` sont copiées automatiquement lors du build

**Prisma generate échoue** → Vérifiez que le schéma Prisma est valide : `npx prisma validate`
