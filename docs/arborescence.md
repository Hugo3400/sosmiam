# Arborescence de SOS Miam

```
sos-miam/
├── CLAUDE.md                  règles du projet
├── docs/                      arborescence (ce fichier) et décisions produit
├── scripts/                   outils du dépôt (verifier-lignes.sh, deployer-site.sh, generer-kit-media.sh, recuperer-inscrits.py, autoriser-poste-gestion.ts, regler-boite-mail.ts, preparer-communes.ts…)
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
| `src/composants/ambassadeur/` | espace ambassadeur : en-tête du cadre (le pied de page est `mise-en-page/PiedDePage`), carte du palier, tuiles et statut de `/espace`, candidature fondateur, propositions de lieux, missions, messages |
| `src/composants/compte/` | formulaires du compte : inscription (et refus d'âge), connexion, nouveau mot de passe, profil, changement de mot de passe, suppression, déconnexion, et leurs champs |
| `src/composants/programme/` | blocs de la page `/programme` : le programme Ambassadeurs expliqué simplement |
| `src/composants/kit-media/` | visuels du kit média dessinés à leur taille exacte (route `/rendu-kit`, capturés par `scripts/generer-kit-media.sh`, `npm run site:kit-media`) et blocs de la page /espace/kit-media (cartes de téléchargement, bouton Copier, couleurs, polices, règles) |
| `src/fonctions/texte/`, `dates/`, `prix/`, `seo/`, `navigation/` | fonctions pures, une par fichier (ex. `formater-prix.ts`) |
| `src/fonctions/hotes/` | partage des adresses entre sosmiam.fr et ambassadeur.sosmiam.fr (`choisir-redirection-hote.ts`, middleware de `root.tsx`) |
| `src/services/` | appels à l'API, côté serveur (un fichier par domaine : `lieux.server.ts`, `comptes.server.ts`, `espace-ambassadeur.server.ts`…) ; `session-compte.server.ts` : cookie de session de l'espace ambassadeur ; `mesure.server.ts` signale chaque page vue à l'API (statistiques sans cookie, middleware de `root.tsx`) |
| `src/hooks/` | hooks React (`utiliser-…`) |
| `src/types/` | formes des réponses de l'API : lieux publics, compte connecté, missions et messages |
| `src/contenus/` | textes éditoriaux : étapes, programme Ambassadeurs (`ambassadeurs.ts`, et `programme-ambassadeur.ts` pour `/programme`), kit média (`kit-media.ts`), ce qu'on offre aux lieux, villes et régions du formulaire d'inscription, catégories de lieux, champs du formulaire « J'inscris mon lieu » (`demande-lieu.ts`), liens publics (`liens-publics.ts` : site, Discord, TikTok, Instagram), tous les liens du pied de page par groupe (`liens-pied-de-page.ts`). Aucun lieu inventé : l'accueil lit les vrais lieux publiés par l'API |
| `src/contenus/faq/` | questions de la FAQ, un fichier par onglet, l'ordre des onglets (`onglets-faq.ts`) et la forme d'une question (`type-faq.ts`) |
| `src/contenus/legal/` | pages légales (un fichier par page ; les sections sur l'espace ambassadeur à part : `confidentialite-compte-ambassadeur.ts`, `cgu-ambassadeurs.ts`) et informations de l'éditeur et de l'hébergeur (`informations-legales.ts`) |
| `src/styles/` | thème Tailwind (couleurs, polices) et styles globaux |
| `tests/` | tests du site (`npm run site:tester`, aussi lancés par `site:verifier`) : partage des adresses entre les deux domaines |

## apps/app-mobile — l'app iOS + Android
| Dossier | Contenu |
|---|---|
| `assets/images`, `icones`, `polices` | images, icône de l'app, polices |
| `src/app/(onglets)/` | écrans des onglets : Pour toi, Explorer, Scan, Potes, Profil (Expo Router) |
| `src/app/(inscription)/` | première ouverture : bienvenue (carrousel), compte, fais connaissance, envies, c'est prêt |
| `src/app/lieu/`, `big-sos/`, `compte/` | écrans d'un lieu, d'un BIG SOS, du compte |
| `src/app/createur/` | page d'un créateur : ses publications, ses partenariats déclarés, Suivre ; la liste « Tu suis » est dans `src/app/suivis.tsx`, les notifications dans `src/app/notifications.tsx` |
| `src/app/potes/` | écrans ouverts depuis l'onglet Potes : sortie, nouvelle sortie, ajouter un pote, profil d'un pote, liste partagée, messages, discussion, nouveau groupe, réseau d'une personne (abonnés, abonnements) |
| `src/app/reglages/` | réglages ouverts depuis le profil : avatar, infos, envies, notifications, compte privé, personnes bloquées |
| `src/app/scan/` | écrans du Scan ouverts par-dessus les onglets : scanner du comptoir, « Tu es où ? » |
| `src/app/visite/`, `visites.tsx` | une visite (code, célébration, refus) et « Mes visites » |
| `src/app/fidelite/`, `reservations/`, `avis/` | cartes de fidélité, réservations (réserver : `src/app/lieu/[id]/reserver.tsx`), avis vérifiés |
| `src/app/pro/` | mode pro (comptoir, QR, résas, avis, mon lieu, fidélité, kit), posé par-dessus les onglets perso |
| `src/app/ambassadeur/` | mode ambassadeur (espace, missions, relectures, messages), posé par-dessus les onglets perso |
| `src/composants/…` | un dossier par partie de l'app : interface, fil, signalement, explorer (carte, liste, filtres, roulette), lieux, carte, scan, big-sos, potes, chat (messagerie entre potes), suivi (Suivre / Ne plus suivre, abonnés, suggestions, fournisseur des suivis entre personnes), notifications (cloche, lignes, fournisseur), invite (visite sans compte : feuille « Crée ton compte », écrans d'invitation), visites, fidelite, reservations, avis, pro, ambassadeur (composants de ces parties), modes (bascule entre les modes perso, pro et ambassadeur, et leur fournisseur), services (fournisseur des services des visites), profil, reglages, inscription, marque (mascotte), navigation |
| `src/contenus/inscription/` | textes de l'inscription : diapos de bienvenue, catégories d'envies, villes |
| `src/contenus/` | lieux et publications d'exemple (`lieux-exemples.ts`, `publications-exemples.ts`, avant l'API), correspondances entre envies et lieux, raisons de signalement, badges, défis d'exemple, emoji d'avatar, potes, commentaires et conversations d'exemple (`potes-exemples.ts`, `commentaires-exemples.ts`, `conversations-exemples.ts`), qui suit qui et comptes privés de la démo (`suivis-exemples.ts`), notifications d'exemple (`notifications-exemples.ts`), forme d'une suggestion (`type-suggestion.ts`), données de départ de la démo des visites (`validation-lieux-exemples.ts`, `visites-exemples.ts`, `avis-exemples.ts`, `espace-ambassadeur-exemples.ts`) |
| `src/contenus/cartes/` | cartes (menus, formules) des lieux d'exemple, par zone, réunies dans `cartes-exemples.ts` |
| `src/theme/` | couleurs de la marque (lues aussi par tailwind.config.js) |
| `src/fonctions/geo/`, `dates/`, `notifications/`, `interaction/`, `lieux/`, `inscription/`, `texte/`, `ambassadeur/`, `publications/`, `prix/`, `communaute/`, `chat/`, `suivi/`, `scan/`, `visites/`, `pro/`, `demo/`, `reservations/` | fonctions pures, une par fichier (tri et filtres des lieux, profil d'inscription, distances, points et badges, vignettes, prix, potes et sorties, messagerie, suivis, visites et démo des visites…) |
| `src/services/` | services de l'app (`choisir-services.ts`) ; `demo/` : faux serveur local de la démo des visites, en développement seulement |
| `src/hooks/` | hooks React (`utiliser-…`) |
| `src/stockage/` | données gardées sur le téléphone (profil, avatar, verrou d'âge, mode visite, activité et suivis, communauté de la démo, conversations avec leurs photos et notes vocales, code secret d'invitation, signalements en attente de l'API, préférences de notifications et du son du fil, suivis entre personnes et notifications de la démo, dernier mode de l'app, et magasin, réglages et rôles de la démo des visites) |
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
| `src/ecrans/tableau-de-bord/` | vue d'ensemble : visites, newsletter, modération, ambassadeurs à valider, contenus, dernières actions ; bilan du mois à imprimer en PDF |
| `src/ecrans/statistiques/` | visites du site (et plus tard de l'app) par jour, semaine, mois, année : en direct, jours × heures, parcours (arrivée, sortie, rebond, durée), provenances et campagnes, clics de /liens, appareils, langues, pays, régions, villes, conversions, vitesse, 404, robots ; comparaison et export CSV ; onglet Communauté (comptes, ambassadeurs, missions, points) |
| `src/ecrans/newsletter/` | inscrits (filtres, export CSV, désinscription), rédaction avec aperçu de l'e-mail, envoi à un public choisi (inscrits filtrés ou ambassadeurs, cases à cocher, essai) et suivi des envois |
| `src/ecrans/lieux/` | fiches des lieux : liste, formulaire complet, créneaux d'ouverture, aperçu, historique (modifications, signalements, demandes, missions, BIG SOS) |
| `src/ecrans/publications/` | fil « Pour toi » : publications, vidéos et photos, programmation, aperçu façon téléphone |
| `src/ecrans/moderation/` | signalements de l'app, les graves (publication masquée pour tous) en tête, décisions motivées (règle enfreinte, explication pour l'auteur), messages à l'auteur et à la personne qui a signalé, contestations et réexamen |
| `src/ecrans/maintenance/` | état du serveur (API, base, site, disque, pm2), relance du site ou du bot, journal de gestion |
| `src/ecrans/demandes/` | demandes de lieux (formulaire du site) et propositions Discord : accepter (fiche créée) ou refuser |
| `src/ecrans/annonces/` | annonces écrites ici, publiées par le bot dans le salon d'annonces Discord |
| `src/ecrans/ambassadeurs/` | comptes de l'espace ambassadeur : inscriptions à valider, fiche (points, ambassadeur de ville, note de l'équipe, activité, mot de passe oublié, suppression), candidatures fondateur, missions, messages vers leur espace, classement, villes couvertes, candidats de la newsletter à inviter |
| `src/ecrans/reglages/` | ce poste : identifiant, mot de passe, version et mises à jour, apparence (thème clair ou sombre), réponses types, retrait |
| `src/ecrans/calendrier/` | calendrier du mois : publications et notifications programmées, BIG SOS à la une, missions à rendre |
| `src/ecrans/comptes/` | tous les comptes SOS Miam (un par personne) : recherche, fiche, export des données (demande d'accès), lien de mot de passe, déconnexion partout, suppression |
| `src/ecrans/big-sos/` | BIG SOS : demandes, vérification sur place par un ambassadeur (mission), vote, validation et dates de la une (7 jours), objectif et liens, bilan |
| `src/ecrans/notifications/` | notifications push : réglages Apple et Google, écriture avec aperçu, cible (ville, iPhone ou Android), programmation, estimation avec l'anti-spam, historique |
| `src/composants/editeur/` | éditeur visuel (TipTap) de la newsletter et des annonces Discord : barre d'outils, liens, bouton jaune |
| `src/composants/interface/`, `mise-en-page/` | briques visuelles (bouton, carte, champ, graphique en colonnes, classement, réponse type…), menu, bandeau de mise à jour, recherche partout (Ctrl+K), aide des raccourcis (F1) |
| `src/contenus/` | menu du logiciel, raccourcis clavier, libellés des raisons de signalement, des motifs de modération, du calendrier, des BIG SOS et du programme ambassadeurs (paliers, badges, points, missions), réponses types de départ |
| `src/fonctions/securite/` | clé Ed25519 du poste, coffre chiffré par le mot de passe, message signé (même format que l'API) |
| `src/fonctions/texte/`, `dates/`, `graphiques/`, `newsletter/`, `editeur/`, `moderation/`, `publications/`, `statistiques/`, `maintenance/`, `alertes/`, `recherche/`, `bilan/` | fonctions pures, une par fichier (formats, graduations, document de l'éditeur → e-mail, texte ou Discord, grille jours × heures, grille du calendrier, export CSV, problèmes du serveur, pastilles du menu, résultats de recherche, page du bilan…) |
| `src/services/` | client signé de l'API (`client-gestion.ts`) et un fichier par partie ; `systeme.ts` pour Windows (fichiers, notifications) |
| `src/hooks/` | chargement des données, médias signés, verrouillage après inactivité, alertes Windows et pastilles du menu (modération, demandes, ambassadeurs, BIG SOS, envois ratés…), thème, raccourcis clavier |
| `src/stockage/` | le coffre (clé du poste chiffrée) et les réglages du poste (thème…), gardés dans le profil Windows |
| `tests/` | tests du logiciel (`npm test`) |

## apps/api — le serveur
| Dossier | Contenu |
|---|---|
| `prisma/`, `prisma.config.ts` | schéma de la base, un fichier par domaine dans `prisma/schema/` (base, newsletter, courriels, notifications, statistiques, lieux, big-sos, gestion, comptes, ambassadeurs, fondateurs : zones des fondateurs par ville ou département et compteur des numéros nationaux), migrations (`npm run base:nouvelle-migration -- <nom>` puis `npm run api:migrer`), données de départ |
| `src/donnees/` | données fixes lues par l'API : `communes.json`, les communes habitées de France et des collectivités d'outre-mer (code INSEE, nom, département, population, codes postaux, et arrondissements de Paris, Lyon et Marseille), refait chaque année par `npm run api:communes` (`scripts/preparer-communes.ts`, qui écrit aussi le SQL des zones des fondateurs) |
| `src/demarrer.ts`, `src/application.ts` | lancement du serveur (127.0.0.1:5192, pm2 « sos-miam-api ») et assemblage d'Express |
| `src/base-de-donnees/` | connexion Prisma ; `client-genere/` est recréé par `prisma generate` (jamais commité) |
| `src/routes/` | adresses de l'API, un fichier par domaine : inscriptions, mesure (pages vues du site), signalements, gestion (`/api-gestion`, le logiciel de gestion), comptes de l'espace ambassadeur (`comptes.ts` : inscription, connexion, Mon compte, candidature fondateur, propositions de lieux), espace ambassadeur (`espace-ambassadeur.ts` : missions et messages du compte connecté)… |
| `src/controleurs/` | lecture de la requête et envoi de la réponse ; `gestion/` pour le logiciel de gestion (et la vérification de ses champs) |
| `src/services/` | logique métier ; `mesure.ts` (compteur de visites sans cookie) et `stockage-stats.ts` ; comptes de l'espace ambassadeur (`comptes.ts`, `comptes-espace.ts`, sessions dans `stockage-sessions-comptes.ts`, ménage de nuit dans `menage-comptes.ts`, et `comptes-en-memoire.ts` pour les tests) ; `gestion/` pour le logiciel de gestion (accès autorisés, statistiques, newsletter et ses envois, lieux, publications, médias, modération, comptes, ambassadeurs, missions et messages, BIG SOS, notifications, maintenance, journal, alertes, recherche partout, calendrier, historique d'un lieu, statistiques de la communauté, bilan du mois, réponses types) ; `courriels/` pour l'envoi des mails par la boîte bonjour@ (SMTP de l'hébergement mail, file d'attente, mails des comptes) ; `notifications/` pour l'envoi direct des notifications push (Apple APNs, Google FCM, anti-spam) ; `big-sos-publics.ts` (BIG SOS en cours, pour le site et l'app) |
| `src/middlewares/` | erreurs, limite de requêtes, protection du logiciel de gestion (signature, code à 6 chiffres, session) et ses origines autorisées, protection des comptes de l'espace ambassadeur (`proteger-comptes.ts` : session, ambassadeur validé) |
| `src/fonctions/geo/`, `securite/`, `dates/`, `mesure/`, `texte/`, `courriels/`, `notifications/`, `big-sos/` | fonctions pures, une par fichier (signature Ed25519, code à 6 chiffres, empreinte scrypt des mots de passe, jetons de session, périodes, esquisse HyperLogLog, gabarit et nouveaux essais des mails, jetons Apple et Google, anti-spam, phase d'un BIG SOS…) ; dans `geo/`, la recherche de communes (`chercher-communes.ts` : sans accents, « st » pour « saint », code postal, arrondissements), son index préparé une fois à la demande (`charger-index-communes.ts`) et la commune d'un code INSEE (`trouver-commune-par-code.ts`) |
| `src/fonctions/fondateurs/` | règles des fondateurs par ville : places d'une ville selon sa population (`calculer-places-ville.ts`), code de la zone d'une commune (`calculer-code-zone.ts`), nom avec « de » pour la carte (`ecrire-nom-avec-de.ts`), construction des zones (`construire-zones-fondateurs.ts`, pour `scripts/preparer-communes.ts`) |
| `src/fonctions/ambassadeurs/` | palier atteint selon les points (`calculer-palier-aux-points.ts`, mêmes seuils que `packages/commun`) |
| `src/fonctions/comptes/` | règles des comptes de l'espace ambassadeur : âge à la date de Paris, mot de passe acceptable, attente après des échecs, nettoyage des champs, erreur résumée sans donnée personnelle |
| `src/temps-reel/` | mises à jour en direct (SSE) et notifications push |
| `src/paiements/` | Stripe : bons solidaires |
| `src/emails/` | vide : les mails sont dans `src/services/courriels/` (file d'attente, envoi, mails des comptes) et `src/fonctions/courriels/` (gabarit) |
| `src/taches/` | tâches planifiées : la nuit, ménage (contacts de demandes de plus de 3 ans ; journal des mails de plus de 90 jours ; comptes : sessions expirées, comptes refusés depuis 30 jours, rôle d'ambassadeur retiré après 1 an sans visite, compte effacé après 2 ans sans connexion, candidatures refusées depuis 3 mois, liens expirés), alertes par mail 30 jours avant le retrait du rôle et avant l'effacement, puis sauvegarde chiffrée de la base ; plus tard, recharge des rescousses le lundi, fin des BIG SOS… |
| `tests/` | tests de l'API (`outils/` : banc d'essai des routes signées du logiciel de gestion) |

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
| `src/types/` | types TypeScript (Lieu, Sos, DossierBigSos…), suivis (abonnés, demandes, notifications), visites, rôles, comptoir, fidélité, réservations, avis, espace ambassadeur |
| `src/regles/` | règles métier : paliers, rayon d'alerte, anti-spam, étapes du BIG SOS, qui peut suivre qui, compte privé, visibilité d'un profil, visites (rayon, QR, délais), fidélité, réservations, avis |
| `src/fonctions/` | fonctions pures partagées, une par fichier (géo, visites, QR, fidélité, réservations, avis, rôles, texte, temps (heure de Paris) ; contrôle plus tard) |
| `src/contenus/` | données partagées par le site et l'app : villes de France avec leurs coordonnées (`villes-france.ts`), messages d'erreur des services, motifs de refus, modes de validation, statuts d'ambassadeur, raisons de relecture des avis |
| `src/theme/` | couleurs, polices, arrondis (utilisés par le site et l'app) |
| `src/validation/` | règles des formulaires (inscription, demande de BIG SOS…) |
| `src/client-api/` | contrats des services (visites, fidélité, réservations, avis, comptoir, espace ambassadeur) et forme des réponses de l'API |
| `tests/` | tests des règles (`npm run commun:tester`) |
