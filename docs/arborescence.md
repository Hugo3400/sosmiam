# Arborescence de SOS Miam

```
sos-miam/
├── CLAUDE.md                  règles du projet
├── docs/                      arborescence (ce fichier) et décisions produit
├── scripts/                   outils du dépôt (verifier-lignes.sh…)
├── apps/
│   ├── site-web/              LE SITE (React Router 8)
│   ├── app-mobile/            L'APP iOS + Android (Expo)
│   ├── logiciel-gestion/      LE LOGICIEL ORDINATEUR de gestion (Tauri) — plus tard
│   ├── api/                   LE SERVEUR (Express + Prisma + PostgreSQL)
│   └── bot-discord/           LE BOT du serveur Discord (discord.js)
└── packages/
    └── commun/                code partagé par le site, l'app et l'API
```

## apps/site-web — le site
| Dossier | Contenu |
|---|---|
| `public/images`, `public/icones` | fichiers servis tels quels (image de partage, favicon, icônes) ; `public/favicon.ico` reste à la racine, où les navigateurs le cherchent |
| `src/root.tsx`, `src/routes.ts` | squelette HTML de toutes les pages, et la liste des adresses du site |
| `src/routes/public/` | pages visibles par tous : accueil, FAQ, villes, fiches lieux, BIG SOS, pros, ambassadeurs, pages légales |
| `src/routes/compte/` | connexion, inscription, mot de passe oublié |
| `src/routes/pro/` | espace restaurateur : fiche, SOS du soir, statistiques, abonnement, BIG SOS |
| `src/routes/ambassadeur/` | espace ambassadeur : propositions, vérifications sur place |
| `src/composants/interface/` | briques de base réutilisables : Bouton, Badge, Onglets, Interrupteur… |
| `src/composants/mise-en-page/` | EnTete, PiedDePage, MenuMobile, Section… |
| `src/composants/marque/` | dessins du kit de marque : Bouee, Mascotte, Ecusson, PictoCategorie, BadgePalier (le Logo est dans `interface/`) |
| `src/composants/accueil/` | blocs de la page d'accueil |
| `src/composants/lieux/` | cartes et fiches de lieux |
| `src/composants/big-sos/` | une, page, jauge, bons solidaires |
| `src/composants/faq/` | onglets, recherche et questions de la FAQ |
| `src/composants/cookies/` | bandeau et réglages des cookies |
| `src/composants/legal/` | affichage des pages légales (mentions, confidentialité, cookies, CGU) |
| `src/composants/pro/`, `ambassadeur/` | composants propres à chaque espace |
| `src/fonctions/texte/`, `dates/`, `prix/`, `seo/`, `navigation/` | fonctions pures, une par fichier (ex. `formater-prix.ts`) |
| `src/services/` | appels à l'API (un fichier par domaine : `lieux.ts`, `comptes.ts`…) |
| `src/hooks/` | hooks React (`utiliser-…`) |
| `src/contenus/` | textes éditoriaux : étapes, ambassadeurs, ce qu'on offre aux lieux, villes, lieux d'exemple |
| `src/contenus/faq/` | questions de la FAQ, un fichier par onglet, l'ordre des onglets (`onglets-faq.ts`) et la forme d'une question (`type-faq.ts`) |
| `src/contenus/legal/` | pages légales (un fichier par page) et informations de l'éditeur et de l'hébergeur (`informations-legales.ts`) |
| `src/styles/` | thème Tailwind (couleurs, polices) et styles globaux |
| `tests/` | tests du site |

## apps/app-mobile — l'app iOS + Android
| Dossier | Contenu |
|---|---|
| `assets/images`, `icones`, `polices` | images, icône de l'app, polices |
| `src/app/(onglets)/` | écrans des onglets : Pour toi, Explorer, Scan, Potes, Profil (Expo Router) |
| `src/app/(inscription)/` | première ouverture : bienvenue (carrousel), compte, fais connaissance, envies, c'est prêt |
| `src/app/lieu/`, `big-sos/`, `compte/` | écrans d'un lieu, d'un BIG SOS, du compte |
| `src/composants/…` | un dossier par partie de l'app : interface, fil, lieux, carte, scan, big-sos, potes, profil, inscription, marque (mascotte), navigation |
| `src/contenus/inscription/` | textes de l'inscription : diapos de bienvenue, catégories d'envies, villes |
| `src/theme/` | couleurs de la marque (lues aussi par tailwind.config.js) |
| `src/fonctions/geo/`, `dates/`, `notifications/`, `interaction/` | fonctions pures, une par fichier |
| `src/services/` | appels à l'API |
| `src/hooks/` | hooks React (`utiliser-…`) |
| `src/stockage/` | données gardées sur le téléphone (session, préférences) |
| `tests/` | tests de l'app |

## apps/logiciel-gestion — le logiciel ordinateur de gestion (plus tard)
L'administration de SOS Miam se fait ici, pas sur le site. Stack prévue : Tauri 2 + React + Vite (comme TabulaDB).
| Dossier | Contenu |
|---|---|
| `src-tauri/` | partie native : fenêtre, notifications système, mises à jour du logiciel |
| `src/ecrans/tableau-de-bord/` | vue d'ensemble : SOS en cours, BIG SOS, inscriptions, alertes |
| `src/ecrans/moderation/` | avis signalés, photos, contenus à vérifier |
| `src/ecrans/notifications/` | envoi et suivi des notifications aux utilisateurs |
| `src/ecrans/big-sos/` | validation admin des BIG SOS, suivi des 7 jours, bilans |
| `src/ecrans/lieux/`, `utilisateurs/` | gestion des fiches et des comptes (pros, ambassadeurs, clients) |
| `src/ecrans/maintenance/` | état des serveurs, sauvegardes, journaux, mode maintenance |
| `src/composants/interface/`, `mise-en-page/` | briques visuelles du logiciel |
| `src/fonctions/`, `services/`, `hooks/` | fonctions pures, appels à l'API (routes réservées aux admins), hooks |
| `tests/` | tests du logiciel |

## apps/api — le serveur
| Dossier | Contenu |
|---|---|
| `prisma/` | schéma de la base, migrations, données de départ |
| `src/routes/` | adresses de l'API, un fichier par domaine : lieux, comptes, sos, big-sos, rescousses, visites… |
| `src/controleurs/` | lecture de la requête et envoi de la réponse |
| `src/services/` | logique métier (lancer un SOS, valider une visite…) |
| `src/middlewares/` | connexion, rôles, erreurs, limite de requêtes |
| `src/fonctions/geo/`, `securite/`, `dates/` | fonctions pures, une par fichier |
| `src/temps-reel/` | mises à jour en direct (SSE) et notifications push |
| `src/paiements/` | Stripe : abonnement Pro, bons solidaires |
| `src/emails/` | modèles et envoi des e-mails |
| `src/taches/` | tâches planifiées : recharge des rescousses le lundi, fin des BIG SOS… |
| `tests/` | tests de l'API |

## apps/bot-discord — le bot du serveur Discord
Paquet autonome (son propre node_modules). Node lance les fichiers `.ts` tels quels : pas de compilation, `tsc` ne fait que vérifier les types. Mode d'emploi : `apps/bot-discord/README.md`.
| Dossier | Contenu |
|---|---|
| `src/demarrer.ts` | point d'entrée : connexion, enregistrement des commandes sur chaque serveur, événements |
| `src/commandes/` | une commande slash par fichier (`faq.ts`, `proposer-lieu.ts`…), et leur liste (`liste-commandes.ts`) |
| `src/evenements/` | réponses aux événements Discord : interactions, arrivée d'un membre |
| `src/messages/` | messages et formulaire du bot (texte et mise en forme), un par fichier : `creer-message-…` |
| `src/contenus/` | questions de la FAQ (reprises du site, à garder en phase), types de lieux, liens publics |
| `src/stockage/` | réglages de chaque serveur (salons choisis avec `/config`), gardés dans `donnees/` (non commité) |
| `src/interface/` | couleurs de la marque au format Discord |
| `src/fonctions/texte/`, `discord/` | fonctions, une par fichier (recherche dans la FAQ, bloc de message, erreurs) |
| `tests/` | tests du bot (`npm test`) |

## packages/commun — partagé
| Dossier | Contenu |
|---|---|
| `src/types/` | types TypeScript (Lieu, Sos, DossierBigSos…) |
| `src/regles/` | règles métier : paliers, rayon d'alerte, anti-spam, étapes du BIG SOS |
| `src/theme/` | couleurs, polices, arrondis (utilisés par le site et l'app) |
| `src/validation/` | règles des formulaires (inscription, demande de BIG SOS…) |
| `src/client-api/` | fonctions pour appeler l'API, utilisées par le site et l'app |
