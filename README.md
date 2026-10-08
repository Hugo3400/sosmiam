# SOS Miam

Fais découvrir les lieux indépendants qui ont besoin de monde. Sauve une table, régale-toi.

| Dossier | Quoi |
|---|---|
| `apps/site-web` | le site (React Router 8) |
| `apps/app-mobile` | l'app iOS + Android (Expo) |
| `apps/logiciel-gestion` | le logiciel ordinateur de gestion (Tauri), réservé aux postes autorisés de Hugo |
| `apps/api` | le serveur (Express + Prisma + PostgreSQL) |
| `apps/bot-discord` | le bot du serveur Discord (discord.js) |
| `packages/commun` | le code partagé |

- Règles du projet : [CLAUDE.md](CLAUDE.md) (700 lignes max par fichier, noms clairs, applis séparées)
- Arborescence détaillée : [docs/arborescence.md](docs/arborescence.md)
- Décisions produit : [docs/decisions.md](docs/decisions.md)

## Commandes
- `npm run site:dev` : lance le site en développement
- `npm run site:verifier` : vérifie les types et la limite de 700 lignes
- `npm run site:deployer` : met en ligne le site sur l'aperçu (https://apercu.sosmiam.fr) et les pages légales de sosmiam.fr
# sosmiam
- `npm run bot:dev` : lance le bot Discord en développement (relancé à chaque modification)
- `npm run bot:verifier` : vérifie les types et les tests du bot, et la limite de 700 lignes
- `npm run gestion:installateur` : construit l'installateur Windows du logiciel de gestion (mode d'emploi : `apps/logiciel-gestion/README.md`)
- `npm run gestion:autoriser -- <clé publique>` : autorise un PC à utiliser le logiciel de gestion (à lancer soi-même, un secret s'affiche)
- `npm run gestion:verifier` : vérifie les types et les tests du logiciel de gestion, et la limite de 700 lignes
- `npm run sauvegardes:cle` : affiche la clé de restauration des sauvegardes chiffrées de la base (à noter, soi-même)
- `npm run sauvegardes:dechiffrer -- <fichier>` : déchiffre une sauvegarde de la base, à restaurer avec pg_restore
