# SOS Miam — règles du projet

Ces règles valent pour tout le monde (Hugo et les sessions Claude). Les respecter avant de proposer une modification.

## 1. 700 lignes maximum par fichier
- Aucun fichier de code (`.ts`, `.tsx`, `.js`, `.css`, `.prisma`, `.sh`…) ne dépasse **700 lignes**.
- Dès qu'un fichier approche **500 lignes**, on le découpe (un composant ou une fonction de plus, dans le bon dossier).
- `npm run verifier:lignes` doit passer avant chaque commit.

## 2. Des noms clairs, rangés dans le bon dossier
- **Dossiers et fichiers** : en français, en minuscules, avec des tirets : `formater-prix.ts`, `big-sos/`.
- **Composants React** : un composant par fichier, nom en PascalCase identique au fichier : `CarteLieu.tsx` exporte `CarteLieu`.
- **Fonctions** : verbe à l'infinitif + ce qu'elle fait, en camelCase : `formaterPrix`, `calculerDistance`, `lancerSos`.
  Dans les dossiers `fonctions/`, **une fonction exportée par fichier**, et le fichier porte son nom : `fonctions/prix/formater-prix.ts` → `formaterPrix`.
- **Interdits** : les noms fourre-tout (`utils`, `helpers`, `divers`, `misc`, `common2`, `temp`, `nouveau`…).

## 3. Le site web et l'app sont séparés
- `apps/site-web` (le site), `apps/app-mobile` (l'app iOS/Android), `apps/logiciel-gestion` (le logiciel ordinateur d'administration), `apps/api` (le serveur) et `apps/bot-discord` (le bot du serveur Discord) **ne s'importent jamais entre eux**.
- L'administration (modération, notifications, validation des BIG SOS, maintenance) se fait dans le logiciel de gestion, pas sur le site.
- Ce qui sert à plusieurs (types, règles métier, couleurs, validation, client de l'API) va dans `packages/commun`.
- Le site, l'app et le bot ne parlent aux données qu'à travers l'API.

## 4. Où ranger quoi
Voir `docs/arborescence.md` : chaque dossier y est décrit. Un nouveau dossier = une ligne de plus dans ce fichier.

## 5. Ton et contenus
- Tous les textes sont en français, au tutoiement, drôles et bienveillants.
- SOS Miam aide aussi des lieux réellement en difficulté (BIG SOS) : on en parle avec dignité, jamais avec misérabilisme.
- Décisions produit et prix : voir `docs/decisions.md` (ne pas inventer de prix ou d'engagements). Idées validées pour plus tard : `docs/idees.md`.
- **Kit de marque** : `kits/SOS_Miam_kit_de_marque/` (logos, mascotte Capitaine Bouiboui, pictos et épingles, bannières, couleurs et typos). Lire son `LISEZMOI.txt` (vocabulaire : les Miamis, la Brigade) avant tout visuel ou texte de marque, et le donner aux agents qui en ont besoin.

## 6. Stack
- Site : React Router 8 (mode framework, rendu serveur), React 19, Vite, Tailwind 4, TypeScript.
- App : Expo (React Native) + Expo Router + NativeWind.
- Logiciel de gestion (plus tard) : Tauri 2 + React + Vite.
- API : Express 5, Prisma 7, PostgreSQL.
- Bot Discord : discord.js 14, Node 22 (TypeScript lancé tel quel, sans compilation).
- Hébergement : VPS (nginx + pm2), domaine sosmiam.fr.
