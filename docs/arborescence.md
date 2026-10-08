# Arborescence de SOS Miam

```
sos-miam/
├── CLAUDE.md                  règles du projet
├── docs/                      arborescence (ce fichier) et décisions produit
├── scripts/                   outils du dépôt (verifier-lignes.sh, deployer-site.sh, generer-kit-media.sh, recuperer-inscrits.py, autoriser-poste-gestion.ts…)
├── apps/
│   ├── site-web/              LE SITE (React Router 8)
│   ├── app-mobile/            L'APP iOS + Android (Expo)
│   ├── logiciel-gestion/      LE LOGICIEL ORDINATEUR de gestion (Tauri), réservé aux postes autorisés de Hugo
│   ├── api/                   LE SERVEUR (Express + Prisma + PostgreSQL)
│   └── bot-discord/           LE BOT du serveur Discord (discord.js)
└── packages/
    └── commun/                code partagé par le site, l'app et l'API
```

## apps/site-web — le site
| Dossier | Contenu |
|---|---|
| `public/images`, `public/icones` | fichiers servis tels quels (image de partage, favicon, icônes) ; `public/favicon.ico` reste à la racine, où les navigateurs le cherchent |
| `kit-media/` | kit média des ambassadeurs (logos, mascotte, badges, visuels pour les réseaux, `kit-media-sos-miam.zip`), refait par `scripts/generer-kit-media.sh` ; hors de `public/` : servi seulement aux ambassadeurs validés, par `/kit-media/<fichier>` |
| `src/root.tsx`, `src/routes.ts` | squelette HTML de toutes les pages, et la liste des adresses du site |
| `src/routes/public/` | pages visibles par tous : accueil, FAQ, villes, fiches lieux, BIG SOS, pros, pages légales, `/statistiques` (ne plus compter ses visites) et `/liens` (le mini-site à mettre en bio TikTok et Instagram) |
| `src/routes/ressources/` | adresses sans page : `localiser` (bouton 📍 du formulaire d'inscription, réponse JSON), `liens/aller/…` (clics de `/liens`), `robots.txt` et `sitemap.xml` (selon le domaine), `kit-media/<fichier>` (fichiers du kit média, ambassadeurs validés seulement) et `rendu-kit/<visuel>` (visuels du kit dessinés à leur taille, serveur de développement seulement) |
| `src/routes/compte/` | comptes de l'espace ambassadeur : inscription (dès 18 ans), connexion, mot de passe oublié, nouveau mot de passe, « Mon compte » (`/espace/mon-compte`) et déconnexion (`/deconnexion`, formulaire POST) |
| `src/routes/pro/` | espace restaurateur : fiche, SOS du soir, statistiques, abonnement, BIG SOS |
| `src/routes/ambassadeur/` | espace ambassadeur (https://ambassadeur.sosmiam.fr) : son cadre (`mise-en-page-ambassadeur.tsx`), `/programme` (page publique qui explique le programme), `/espace` (selon le statut) et ses pages réservées aux ambassadeurs validés : kit média, proposer un lieu, fondateur, missions, messages |
| `src/composants/interface/` | briques de base réutilisables : Bouton, Badge, Onglets, Interrupteur… |
| `src/composants/mise-en-page/` | EnTete, PiedDePage, MenuMobile, Section… |
| `src/composants/marque/` | dessins du kit de marque : Bouee, Mascotte, Ecusson, PictoCategorie, BadgePalier (le Logo est dans `interface/`) |
| `src/composants/accueil/` | blocs de la page d'accueil |
| `src/composants/lieux/` | cartes et fiches de lieux |
| `src/composants/big-sos/` | une, page, jauge, bons solidaires |
| `src/composants/faq/` | onglets, recherche et questions de la FAQ |
| `src/composants/cookies/` | bandeau et réglages des cookies |
| `src/composants/legal/` | affichage des pages légales (mentions, confidentialité, cookies, CGU) |
| `src/composants/liens/` | cartes et icônes de la page `/liens` (site, Discord, TikTok, Instagram) |
| `src/composants/pro/` | composants de l'espace pro : formulaire « J'inscris mon lieu », carte « tout est gratuit » |
| `src/composants/ambassadeur/` | espace ambassadeur : en-tête et pied de page du cadre, carte du palier, tuiles et statut de `/espace`, candidature fondateur, propositions de lieux, missions, messages |
| `src/composants/compte/` | formulaires du compte : inscription (et refus d'âge), connexion, nouveau mot de passe, profil, changement de mot de passe, suppression, déconnexion, et leurs champs |
| `src/composants/programme/` | blocs de la page `/programme` : le programme Ambassadeurs expliqué simplement |
| `src/composants/kit-media/` | visuels du kit média dessinés à leur taille exacte (route `/rendu-kit`, capturés par `scripts/generer-kit-media.sh`, `npm run site:kit-media`) et blocs de la page /espace/kit-media (cartes de téléchargement, bouton Copier, couleurs, polices, règles) |
| `src/fonctions/texte/`, `dates/`, `prix/`, `seo/`, `navigation/` | fonctions pures, une par fichier (ex. `formater-prix.ts`) |
| `src/fonctions/hotes/` | partage des adresses entre sosmiam.fr et ambassadeur.sosmiam.fr (`choisir-redirection-hote.ts`, middleware de `root.tsx`) |
| `src/services/` | appels à l'API, côté serveur (un fichier par domaine : `lieux.server.ts`, `comptes.server.ts`, `espace-ambassadeur.server.ts`…) ; `session-compte.server.ts` : cookie de session de l'espace ambassadeur ; `mesure.server.ts` signale chaque page vue à l'API (statistiques sans cookie, middleware de `root.tsx`) |
| `src/hooks/` | hooks React (`utiliser-…`) |
| `src/types/` | formes des réponses de l'API : lieux publics, compte connecté, missions et messages |
| `src/contenus/` | textes éditoriaux : étapes, programme Ambassadeurs (`ambassadeurs.ts`, et `programme-ambassadeur.ts` pour `/programme`), kit média (`kit-media.ts`), ce qu'on offre aux lieux, villes et régions du formulaire d'inscription, catégories de lieux, champs du formulaire « J'inscris mon lieu » (`demande-lieu.ts`), liens publics (`liens-publics.ts` : site, Discord, TikTok, Instagram). Aucun lieu inventé : l'accueil lit les vrais lieux publiés par l'API |
| `src/contenus/faq/` | questions de la FAQ, un fichier par onglet, l'ordre des onglets (`onglets-faq.ts`) et la forme d'une question (`type-faq.ts`) |
| `src/contenus/legal/` | pages légales (un fichier par page ; les sections sur l'espace ambassadeur à part : `confidentialite-compte-ambassadeur.ts`, `cgu-ambassadeurs.ts`) et informations de l'éditeur et de l'hébergeur (`informations-legales.ts`) |
| `src/contenus/legal/brouillons/` | textes légaux en attente de relecture par Hugo : jamais importés par le site, donc jamais publiés |
| `src/styles/` | thème Tailwind (couleurs, polices) et styles globaux |
| `tests/` | tests du site (`npm run site:tester`, aussi lancés par `site:verifier`) : partage des adresses entre les deux domaines |

## apps/app-mobile — l'app iOS + Android
| Dossier | Contenu |
|---|---|
| `assets/images`, `icones`, `polices` | images, icône de l'app, polices |
| `src/app/(onglets)/` | écrans des onglets : Pour toi, Explorer, Scan, Potes, Profil (Expo Router) |
| `src/app/(inscription)/` | première ouverture : bienvenue (carrousel), compte, fais connaissance, envies, c'est prêt |
| `src/app/lieu/`, `big-sos/`, `compte/` | écrans d'un lieu, d'un BIG SOS, du compte |
| `src/app/reglages/` | réglages ouverts depuis le profil : avatar, infos, envies, notifications |
| `src/composants/…` | un dossier par partie de l'app : interface, fil, signalement, explorer (carte, liste, filtres, roulette), lieux, carte, scan, big-sos, potes, profil, reglages, inscription, marque (mascotte), navigation |
| `src/contenus/inscription/` | textes de l'inscription : diapos de bienvenue, catégories d'envies, villes |
| `src/contenus/` | lieux et publications d'exemple (`lieux-exemples.ts`, `publications-exemples.ts`, avant l'API), correspondances entre envies et lieux, raisons de signalement, badges, défis d'exemple, emoji d'avatar |
| `src/contenus/cartes/` | cartes (menus, formules) des lieux d'exemple, par zone, réunies dans `cartes-exemples.ts` |
| `src/theme/` | couleurs de la marque (lues aussi par tailwind.config.js) |
| `src/fonctions/geo/`, `dates/`, `notifications/`, `interaction/`, `lieux/`, `inscription/`, `texte/`, `ambassadeur/`, `publications/`, `prix/` | fonctions pures, une par fichier (tri et filtres des lieux, profil d'inscription, distances, points et badges, vignettes, prix…) |
| `src/services/` | appels à l'API |
| `src/hooks/` | hooks React (`utiliser-…`) |
| `src/stockage/` | données gardées sur le téléphone (profil, avatar, activité, signalements en attente de l'API, préférences de notifications) |
| `visuels-stores/` | visuels des fiches App Store et Google Play : captures (iPhone 6,9 et 6,3 pouces, iPad, Android téléphone et tablette), bannière Google Play, en-têtes App Store, icônes |
| `tests/` | tests de l'app |

## apps/logiciel-gestion — le logiciel ordinateur de gestion
L'administration de SOS Miam se fait ici, pas sur le site : Tauri 2 + React + Vite + Tailwind (comme TabulaDB), installateur Windows construit sur le serveur. Il ne parle qu'à l'API (`/api-gestion`), avec des demandes signées par la clé du poste. Mode d'emploi : `apps/logiciel-gestion/README.md`.
| Dossier | Contenu |
|---|---|
| `src-tauri/` | partie native : fenêtre, notifications Windows, une seule instance, enregistrement de fichiers ; icônes (`icons/source/icone-gestion.svg`) |
| `scripts/` | `construire-installateur.sh` (compilation croisée vers Windows) ; l'installateur arrive dans `installateur/` (non commité) |
| `src/Application.tsx`, `src/main.tsx` | connexion (premier lancement, autorisation, déverrouillage), menu et écran choisi |
| `src/ecrans/connexion/` | premier lancement (mot de passe), autorisation du poste sur le serveur, déverrouillage (mot de passe + code à 6 chiffres) |
| `src/ecrans/tableau-de-bord/` | vue d'ensemble : visites, newsletter, modération, ambassadeurs à valider, contenus, dernières actions |
| `src/ecrans/statistiques/` | visites du site (et plus tard de l'app) par jour, semaine, mois, année : en direct, jours × heures, parcours (arrivée, sortie, rebond, durée), provenances et campagnes, clics de /liens, appareils, langues, pays, régions, villes, conversions, vitesse, 404, robots ; comparaison et export CSV |
| `src/ecrans/newsletter/` | inscrits (filtres, export CSV, désinscription) et rédaction des newsletters avec aperçu de l'e-mail |
| `src/ecrans/lieux/` | fiches des lieux : liste, formulaire complet, créneaux d'ouverture, aperçu |
| `src/ecrans/publications/` | fil « Pour toi » : publications, vidéos et photos, programmation, aperçu façon téléphone |
| `src/ecrans/moderation/` | signalements de l'app, les graves (publication masquée pour tous) en tête, décisions |
| `src/ecrans/maintenance/` | état du serveur (API, base, site, disque, pm2), relance du site ou du bot, journal de gestion |
| `src/ecrans/demandes/` | demandes de lieux (formulaire du site) et propositions Discord : accepter (fiche créée) ou refuser |
| `src/ecrans/annonces/` | annonces écrites ici, publiées par le bot dans le salon d'annonces Discord |
| `src/ecrans/ambassadeurs/` | comptes de l'espace ambassadeur : inscriptions à valider, fiche (points, ambassadeur de ville, note de l'équipe, activité, mot de passe oublié, suppression), candidatures fondateur, missions, messages vers leur espace, classement, villes couvertes, candidats de la newsletter à inviter |
| `src/ecrans/reglages/` | ce poste : identifiant, mot de passe, version et mises à jour, retrait |
| `src/ecrans/bientot/` | écran commun des parties à venir |
| `src/ecrans/big-sos/`, `notifications/`, `utilisateurs/` | à venir : validation des BIG SOS, envoi des notifications, comptes |
| `src/composants/interface/`, `mise-en-page/` | briques visuelles (bouton, carte, champ, graphique en colonnes, classement…), menu, bandeau de mise à jour |
| `src/contenus/` | menu du logiciel, libellés des raisons de signalement et du programme ambassadeurs (paliers, badges, points, missions) |
| `src/fonctions/securite/` | clé Ed25519 du poste, coffre chiffré par le mot de passe, message signé (même format que l'API) |
| `src/fonctions/texte/`, `dates/`, `graphiques/`, `newsletter/`, `publications/`, `statistiques/`, `maintenance/` | fonctions pures, une par fichier (formats, graduations, Markdown → e-mail, grille jours × heures, export CSV, problèmes du serveur…) |
| `src/services/` | client signé de l'API (`client-gestion.ts`) et un fichier par partie ; `systeme.ts` pour Windows (fichiers, notifications) |
| `src/hooks/` | chargement des données, médias signés, verrouillage après inactivité, alertes (modération, demandes, ambassadeurs à valider) |
| `src/stockage/` | le coffre (clé du poste chiffrée), gardé dans le profil Windows |
| `tests/` | tests du logiciel (`npm test`) |

## apps/api — le serveur
| Dossier | Contenu |
|---|---|
| `prisma/`, `prisma.config.ts` | schéma de la base, un fichier par domaine dans `prisma/schema/` (base, newsletter, statistiques, lieux, gestion, comptes, ambassadeurs), migrations (`npm run base:nouvelle-migration -- <nom>` puis `npm run api:migrer`), données de départ |
| `src/demarrer.ts`, `src/application.ts` | lancement du serveur (127.0.0.1:5192, pm2 « sos-miam-api ») et assemblage d'Express |
| `src/base-de-donnees/` | connexion Prisma ; `client-genere/` est recréé par `prisma generate` (jamais commité) |
| `src/routes/` | adresses de l'API, un fichier par domaine : inscriptions, mesure (pages vues du site), signalements, gestion (`/api-gestion`, le logiciel de gestion), comptes de l'espace ambassadeur (`comptes.ts` : inscription, connexion, Mon compte, candidature fondateur, propositions de lieux), espace ambassadeur (`espace-ambassadeur.ts` : missions et messages du compte connecté)… |
| `src/controleurs/` | lecture de la requête et envoi de la réponse ; `gestion/` pour le logiciel de gestion (et la vérification de ses champs) |
| `src/services/` | logique métier ; `mesure.ts` (compteur de visites sans cookie) et `stockage-stats.ts` ; comptes de l'espace ambassadeur (`comptes.ts`, `comptes-espace.ts`, sessions dans `stockage-sessions-comptes.ts`, ménage de nuit dans `menage-comptes.ts`, et `comptes-en-memoire.ts` pour les tests) ; `gestion/` pour le logiciel de gestion (accès autorisés, statistiques, newsletter, lieux, publications, médias, modération, ambassadeurs, missions et messages, maintenance, journal) |
| `src/middlewares/` | erreurs, limite de requêtes, protection du logiciel de gestion (signature, code à 6 chiffres, session) et ses origines autorisées, protection des comptes de l'espace ambassadeur (`proteger-comptes.ts` : session, ambassadeur validé) |
| `src/fonctions/geo/`, `securite/`, `dates/`, `mesure/`, `texte/` | fonctions pures, une par fichier (signature Ed25519, code à 6 chiffres, empreinte scrypt des mots de passe, jetons de session, périodes, esquisse HyperLogLog…) |
| `src/fonctions/ambassadeurs/` | palier atteint selon les points (`calculer-palier-aux-points.ts`, mêmes seuils que `packages/commun`) |
| `src/fonctions/comptes/` | règles des comptes de l'espace ambassadeur : âge à la date de Paris, mot de passe acceptable, attente après des échecs, nettoyage des champs, erreur résumée sans donnée personnelle |
| `src/temps-reel/` | mises à jour en direct (SSE) et notifications push |
| `src/paiements/` | Stripe : abonnement Pro, bons solidaires |
| `src/emails/` | modèles et envoi des e-mails |
| `src/taches/` | tâches planifiées : la nuit, ménage (contacts de demandes de plus de 3 ans ; comptes : sessions expirées, comptes refusés depuis 30 jours ou sans visite depuis 1 an, candidatures refusées depuis 3 mois, liens expirés) et sauvegarde chiffrée de la base ; plus tard, recharge des rescousses le lundi, fin des BIG SOS… |
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
| `src/services/` | appels à l'API (routes `/bot`, secret partagé `SECRET_BOT`) : propositions de lieux envoyées au logiciel de gestion |
| `src/taches/` | tâches de fond : publication des annonces écrites dans le logiciel de gestion |
| `src/interface/` | couleurs de la marque au format Discord |
| `src/fonctions/texte/`, `discord/` | fonctions, une par fichier (recherche dans la FAQ, bloc de message, erreurs) |
| `tests/` | tests du bot (`npm test`) |

## packages/commun — partagé
| Dossier | Contenu |
|---|---|
| `src/types/` | types TypeScript (Lieu, Sos, DossierBigSos…) |
| `src/regles/` | règles métier : paliers, rayon d'alerte, anti-spam, étapes du BIG SOS |
| `src/contenus/` | données partagées par le site et l'app : villes de France avec leurs coordonnées (`villes-france.ts`) |
| `src/theme/` | couleurs, polices, arrondis (utilisés par le site et l'app) |
| `src/validation/` | règles des formulaires (inscription, demande de BIG SOS…) |
| `src/client-api/` | fonctions pour appeler l'API, utilisées par le site et l'app |
