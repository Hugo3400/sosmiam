# Arborescence de SOS Miam

```
sos-miam/
├── CLAUDE.md                  règles du projet
├── docs/                      arborescence (ce fichier), décisions produit et idées pour plus tard (idees.md)
├── kits/                      kit de marque (logos, mascotte Capitaine Bouiboui, pictos, bannières, couleurs ; voir LISEZMOI.txt) et archives des vidéos
├── scripts/                   outils du dépôt (verifier-lignes.sh, deployer-site.sh, generer-kit-media.sh, generer-kit-media-pro.sh, recuperer-inscrits.py, lire-boite-mail.py, autoriser-poste-gestion.ts, regler-boite-mail.ts, preparer-communes.ts…)
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
| `kit-media-pro/` | kit média pro des ambassadeurs certifiés, pour présenter SOS Miam aux lieux : affiche A4 et flyer A6 recto verso en PNG (300 dpi) et en PDF à imprimer, `kit-media-pro-sos-miam.zip` (avec `a-lire.txt` : mot du comptoir, mail type, règles), refait par `scripts/generer-kit-media-pro.sh` (`npm run site:kit-media-pro`) ; hors de `public/`, réservé aux certifiés |
| `src/root.tsx`, `src/routes.ts` | squelette HTML de toutes les pages, et la liste des adresses du site |
| `src/routes/public/` | pages visibles par tous : accueil, FAQ, villes, fiches lieux, BIG SOS, pros, pages légales, `/statistiques` (ne plus compter ses visites) et `/liens` (le mini-site à mettre en bio TikTok et Instagram) ; `fiche-lieu.tsx` : la fiche publique d'un lieu (`/lieux/:id`, Vérifié ✓ ou non vérifié, infos pratiques, « Ce lieu est à toi ? ») |
| `src/routes/ressources/` | adresses sans page : `localiser` (bouton 📍 du formulaire d'inscription, réponse JSON), `communes` (suggestions de « Ta ville » : le site appelle l'API pour le navigateur), `espace/fondateur/carte.svg` (carte de fondateur numérique, réservée à son fondateur), `liens/aller/…` (clics de `/liens`), `robots.txt` et `sitemap.xml` (selon le domaine), `kit-media/<fichier>` (fichiers du kit média, ambassadeurs validés seulement), `kit-media-pro/<fichier>` (fichiers du kit média pro, ambassadeurs certifiés seulement, 403 sinon), `rendu-kit/<visuel>` (visuels du kit dessinés à leur taille, serveur de développement seulement) et `rendu-kit-pro/<visuel>` (affiche et flyer du kit pro, en page PNG ou en PDF avec `?impression=1`, serveur de développement seulement) ; `recherche-lieux` (suggestions de « Chercher mon lieu » de l'espace pro, avec la session) |
| `src/routes/compte/` | comptes de l'espace ambassadeur : inscription (dès 18 ans), connexion, mot de passe oublié (libre-service), nouveau mot de passe, confirmation de l'e-mail (`/verifier-email`), « Mon compte » (`/espace/mon-compte`) et déconnexion (`/deconnexion`, formulaire POST) ; leur cadre (`mise-en-page-compte.tsx`) suit l'hôte : celui de l'espace pro sur pro.sosmiam.fr, celui de l'espace ambassadeur ailleurs |
| `src/routes/pro/` | espace pro (https://pro.sosmiam.fr) : son cadre (`mise-en-page-pro.tsx`), `/bienvenue` (page publique et indexée), `/tableau` (mes lieux, invitations), `/rattacher` et `/rattacher/:id` (chercher son lieu, demander sa fiche), `/lieu/:id` (ma fiche, lecture seule pour l'équipe), `/lieu/:id/suggestions`, `/lieu/:id/equipe`, `/lieu/:id/affichette` (affichette de table A6 imprimable) |
| `src/routes/ambassadeur/` | espace ambassadeur (https://ambassadeur.sosmiam.fr) : son cadre (`mise-en-page-ambassadeur.tsx`), `/programme` (page publique qui explique le programme), `/espace` (selon le statut) et ses pages réservées aux ambassadeurs validés : kit média, proposer un lieu, fondateur, ambassadeur certifié (`/espace/certification` : candidature et état), kit média pro (`/espace/kit-media-pro`, certifiés seulement), missions, messages |
| `src/composants/interface/` | briques de base réutilisables : Bouton, Badge, Onglets, Interrupteur… |
| `src/composants/mise-en-page/` | EnTete, PiedDePage, MenuMobile, Section… |
| `src/composants/marque/` | dessins du kit de marque : Bouee, Mascotte, Ecusson, PictoCategorie, BadgePalier (le Logo est dans `interface/`) |
| `src/composants/accueil/` | blocs de la page d'accueil |
| `src/composants/lieux/` | cartes et fiches de lieux : badge Vérifié ✓ / Lieu non vérifié, bloc « Infos pratiques » (une info inconnue n'est jamais affichée), prévention (bars), encart « Ce lieu est à toi ? » |
| `src/composants/big-sos/` | une, page, jauge, bons solidaires |
| `src/composants/faq/` | onglets, recherche et questions de la FAQ |
| `src/composants/cookies/` | bandeau et réglages des cookies |
| `src/composants/legal/` | affichage des pages légales (mentions, confidentialité, cookies, CGU) |
| `src/composants/liens/` | cartes et icônes de la page `/liens` (site, Discord, TikTok, Instagram) |
| `src/composants/pro/` | « J'inscris mon lieu » (formulaire, carte « tout est gratuit ») et l'espace pro : cadre et en-tête « SOS Miam · pro », cartes de /bienvenue, du tableau (lieu, invitation, gestes sur une demande), recherche de lieu (formulaire GET sans JavaScript, suggestions avec), formulaire de rattachement, formulaire « Ma fiche » en sections et sa lecture seule, suggestions (avant → après), équipe, affichette A6 et bouton Imprimer |
| `src/composants/ambassadeur/` | espace ambassadeur : en-tête du cadre (le pied de page est `mise-en-page/PiedDePage`), carte du palier, tuiles et statut de `/espace`, candidature fondateur, candidature et état d'ambassadeur certifié, propositions de lieux, missions, messages |
| `src/composants/compte/` | formulaires du compte : inscription (et refus d'âge), connexion, nouveau mot de passe, confirmation de l'e-mail (et son bandeau « Renvoyer le lien »), profil, changement de mot de passe, suppression, déconnexion, et leurs champs (dont « Ta ville » dans un formulaire POST : `ChampCommuneFormulaire`) |
| `src/composants/fondateurs/` | fondateurs par ville : recherche de commune (formulaire GET sans JavaScript, suggestions avec), places d'une zone, tableau des places, choix de la commune d'une candidature, carte de fondateur (SVG) et son téléchargement |
| `src/composants/programme/` | blocs de la page `/programme` : le programme Ambassadeurs expliqué simplement |
| `src/composants/kit-media/` | visuels du kit média dessinés à leur taille exacte (route `/rendu-kit`, capturés par `scripts/generer-kit-media.sh`, `npm run site:kit-media`) et blocs de la page /espace/kit-media (cartes de téléchargement, bouton Copier, couleurs, polices, règles) |
| `src/composants/kit-media-pro/` | affiche A4 et flyer A6 du kit média pro dessinés à 300 dpi, planche de 4 flyers sur A4 avec traits de coupe, QR code calculé sur place (bibliothèque `uqr`), page de rendu PNG ou PDF (route `/rendu-kit-pro`, développement seulement) ; `uqr` est une dépendance normale du site : le QR de l'affichette de l'espace pro est dessiné en ligne, et les blocs de la page `/espace/kit-media-pro` (cartes de téléchargement, textes à copier) |
| `src/fonctions/texte/`, `dates/`, `prix/`, `seo/`, `navigation/` | fonctions pures, une par fichier (ex. `formater-prix.ts`) |
| `src/fonctions/fondateurs/` | textes des fondateurs par ville, une fonction par fichier : places d'une zone en une phrase, nom avec son article, titre de la carte, lecture d'un code de commune |
| `src/fonctions/pro/` | espace pro, une fonction par fichier : lecture et vérification du formulaire « Ma fiche », champs qui changent vraiment, valeur d'un champ en mots (suggestions) |
| `src/fonctions/hotes/` | partage des adresses entre sosmiam.fr, ambassadeur.sosmiam.fr et pro.sosmiam.fr (`choisir-redirection-hote.ts`, middleware de `root.tsx`) et espace d'un hôte pour les pages du compte (`lire-espace-hote.ts`) |
| `src/services/` | appels à l'API, côté serveur (un fichier par domaine : `lieux.server.ts`, `comptes.server.ts`, `espace-ambassadeur.server.ts`, `fondateurs.server.ts` (communes et places des zones), `verification-email.server.ts` (« Renvoyer le lien »), `certification.server.ts` (candidature d'ambassadeur certifié)…) ; `session-compte.server.ts` : cookie de session de l'espace ambassadeur ; `mesure.server.ts` signale chaque page vue à l'API (statistiques sans cookie, middleware de `root.tsx`) ; `pro.server.ts` : espace pro (demandes et invitations, recherche de lieux, fiche, suggestions, équipe) et fiche publique d'un lieu ; `lieu-pro.server.ts` : accès à un lieu de l'espace pro (404 si ce n'est pas le sien) |
| `src/hooks/` | hooks React (`utiliser-…`) |
| `src/types/` | formes des réponses de l'API : lieux publics, compte connecté, candidature et zones de fondateurs, titre et candidature d'ambassadeur certifié, missions et messages ; espace pro et fiche publique d'un lieu (`pro.ts`) |
| `src/contenus/` | textes éditoriaux : étapes, programme Ambassadeurs (`ambassadeurs.ts`, et `programme-ambassadeur.ts` pour `/programme`), choix de la candidature d'ambassadeur certifié (`ambassadeur-certifie.ts`), kit média (`kit-media.ts`) et kit média pro (`kit-media-pro.ts` : affiche, flyer, mot du comptoir, mail type, règles), ce qu'on offre aux lieux, villes et régions du formulaire d'inscription, catégories de lieux, champs du formulaire « J'inscris mon lieu » (`demande-lieu.ts`), liens publics (`liens-publics.ts` : site, Discord, TikTok, Instagram), tous les liens du pied de page par groupe (`liens-pied-de-page.ts`). Aucun lieu inventé : l'accueil lit les vrais lieux publiés par l'API ; textes de l'espace pro (`espace-pro.ts`) et libellés des infos pratiques (`infos-pratiques.ts`, mêmes mots que packages/commun) |
| `src/contenus/faq/` | questions de la FAQ, un fichier par onglet, l'ordre des onglets (`onglets-faq.ts`) et la forme d'une question (`type-faq.ts`) |
| `src/contenus/legal/` | pages légales (un fichier par page ; les sections sur l'espace ambassadeur à part : `confidentialite-compte-ambassadeur.ts`, `cgu-ambassadeurs.ts`) et informations de l'éditeur et de l'hébergeur (`informations-legales.ts`) |
| `src/styles/` | thème Tailwind (couleurs, polices) et styles globaux |
| `tests/` | tests du site (`npm run site:tester`, aussi lancés par `site:verifier`) : partage des adresses entre les deux domaines, appels à l'API des comptes, textes des fondateurs par ville |

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
| `src/composants/…` | un dossier par partie de l'app : interface, fil, signalement, explorer (carte, liste, filtres, roulette), lieux, carte, scan, big-sos, potes, chat (messagerie entre potes), suivi (Suivre / Ne plus suivre, abonnés, suggestions, fournisseur des suivis entre personnes), notifications (cloche, lignes, fournisseur), invite (visite sans compte : feuille « Crée ton compte », écrans d'invitation), visites, fidelite, reservations, avis, pro, ambassadeur (composants de ces parties), prevention (message sanitaire de la loi Évin et lien vers Alcool Info Service, à côté de tout ce qui parle d'alcool), modes (bascule entre les modes perso, pro et ambassadeur, et leur fournisseur), services (fournisseur des services des visites), profil, reglages, inscription, marque (mascotte), navigation |
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
| `src/ecrans/lieux/` | fiches des lieux : liste par pages (filtres statut, type, ville, catégorie, fiche à compléter, compte pro vérifié ✓), carte (Plan IGN), contrôle (positions douteuses, doublons, sans position), import CSV, formulaire complet avec infos pratiques et contrôle qualité (fiche suivante), comptes pro du lieu, créneaux d'ouverture, aperçu, historique (modifications, signalements, demandes, missions, BIG SOS), modifications proposées par un client ou un lieu (avant, maintenant, proposé ; réponse par mail) |
| `src/ecrans/publications/` | fil « Pour toi » : publications, vidéos et photos, programmation, aperçu façon téléphone |
| `src/ecrans/moderation/` | signalements de l'app, les graves (publication masquée pour tous) en tête, décisions motivées (règle enfreinte, explication pour l'auteur), messages à l'auteur et à la personne qui a signalé, contestations et réexamen |
| `src/ecrans/maintenance/` | état du serveur (API, base, site, disque, pm2), relance du site ou du bot, journal de gestion |
| `src/ecrans/demandes/` | demandes de lieux (formulaire du site) et propositions Discord : accepter (fiche créée, lieux semblables signalés) ou refuser ; demandes de compte pro (rattachement à un lieu, lieu vérifié ✓) |
| `src/ecrans/annonces/` | annonces écrites ici, publiées par le bot dans le salon d'annonces Discord |
| `src/ecrans/ambassadeurs/` | comptes de l'espace ambassadeur : inscriptions à valider, fiche (points, ambassadeur de ville, note de l'équipe, activité, mot de passe oublié, suppression), fondateurs par ville (candidatures, commune, acceptation avec les deux numéros, place libérée, places par zone), ambassadeurs certifiés (candidatures, titre retiré), missions, messages vers leur espace, classement, villes couvertes, candidats de la newsletter à inviter |
| `src/ecrans/reglages/` | ce poste : identifiant, mot de passe, version et mises à jour, apparence (thème clair ou sombre), réponses types, retrait |
| `src/ecrans/villes/` | « Lancer une ville » : où en est chaque ville (fiches, places de fondateur, ambassadeurs, public à prévenir), puis l'annonce |
| `src/ecrans/boite/` | boîte de réception de bonjour@sosmiam.fr (lue en direct en IMAP), lecture d'un mail, réponse dans le même fil, mails reçus d'un compte |
| `src/ecrans/calendrier/` | calendrier du mois : publications et notifications programmées, BIG SOS à la une, missions à rendre |
| `src/ecrans/comptes/` | tous les comptes SOS Miam (un par personne) : recherche, fiche, export des données (demande d'accès), lien de mot de passe, déconnexion partout, suppression |
| `src/ecrans/big-sos/` | BIG SOS : demandes, vérification sur place par un ambassadeur (mission), vote, validation et dates de la une (7 jours), objectif et liens, bilan |
| `src/ecrans/notifications/` | notifications push : réglages Apple et Google, écriture avec aperçu, cible (ville, iPhone ou Android), programmation, estimation avec l'anti-spam, historique |
| `src/composants/editeur/` | éditeur visuel (TipTap) de la newsletter et des annonces Discord : barre d'outils, liens, bouton jaune |
| `src/composants/interface/`, `mise-en-page/` | briques visuelles (bouton, carte, champ, graphique en colonnes, classement, réponse type…), menu, bandeau de mise à jour, recherche partout (Ctrl+K), aide des raccourcis (F1) |
| `src/contenus/` | menu du logiciel, raccourcis clavier, libellés des raisons de signalement, des motifs de modération, du calendrier, des BIG SOS et du programme ambassadeurs (paliers, badges, points, missions), réponses types de départ |
| `src/fonctions/securite/` | clé Ed25519 du poste, coffre chiffré par le mot de passe, message signé (même format que l'API) |
| `src/fonctions/texte/`, `dates/`, `graphiques/`, `newsletter/`, `editeur/`, `moderation/`, `publications/`, `statistiques/`, `maintenance/`, `alertes/`, `recherche/`, `bilan/`, `fondateurs/`, `lieux/` | fonctions pures, une par fichier (formats, graduations, document de l'éditeur → e-mail, texte ou Discord, grille jours × heures, grille du calendrier, export CSV, problèmes du serveur, pastilles du menu, résultats de recherche, page du bilan…) |
| `src/services/` | client signé de l'API (`client-gestion.ts`) et un fichier par partie ; `systeme.ts` pour Windows (fichiers, notifications) |
| `src/hooks/` | chargement des données, médias signés, verrouillage après inactivité, alertes Windows et pastilles du menu (modération, demandes, ambassadeurs, BIG SOS, envois ratés…), thème, raccourcis clavier |
| `src/stockage/` | le coffre (clé du poste chiffrée) et les réglages du poste (thème…), gardés dans le profil Windows |
| `tests/` | tests du logiciel (`npm test`) |

## apps/api — le serveur
| Dossier | Contenu |
|---|---|
| `prisma/`, `prisma.config.ts` | schéma de la base, un fichier par domaine dans `prisma/schema/` (base, newsletter, courriels, notifications, statistiques, lieux, big-sos, gestion, comptes, ambassadeurs, fondateurs : zones des fondateurs par ville ou département et compteur des numéros nationaux), migrations (`npm run base:nouvelle-migration -- <nom>` puis `npm run api:migrer`), données de départ |
| `src/donnees/` | données fixes lues par l'API : `communes.json`, les communes habitées de France et des collectivités d'outre-mer (code INSEE, nom, département, population, codes postaux, et arrondissements de Paris, Lyon et Marseille), refait chaque année par `npm run api:communes` (`scripts/preparer-communes.ts`, qui écrit aussi le SQL des zones des fondateurs) ; `mots-de-passe-courants.txt`, la grande liste des mots de passe refusés (SecLists, licence MIT : source, licence et date en tête du fichier) |
| `src/demarrer.ts`, `src/application.ts` | lancement du serveur (127.0.0.1:5192, pm2 « sos-miam-api ») et assemblage d'Express |
| `src/base-de-donnees/` | connexion Prisma ; `client-genere/` est recréé par `prisma generate` (jamais commité) |
| `src/routes/` | adresses de l'API, un fichier par domaine : inscriptions, mesure (pages vues du site), signalements, gestion (`/api-gestion`, le logiciel de gestion), comptes de l'espace ambassadeur (`comptes.ts` : inscription, connexion, Mon compte, candidature fondateur, propositions de lieux, suggestions de modification d'une fiche), espace ambassadeur (`espace-ambassadeur.ts` : missions et messages du compte connecté), espace pro (`pro.ts` : chercher son lieu, sa fiche, les suggestions sur son lieu, son équipe ; les demandes de rattachement sont dans `comptes.ts`), lieux publics (`lieux-publics.ts` : la liste et la fiche publique d'un lieu publié), fondateurs (`fondateurs.ts` : recherche de commune et places des zones, sans session)… |
| `src/controleurs/` | lecture de la requête et envoi de la réponse ; comptes de l'espace ambassadeur (`comptes.ts`, `comptes-moi.ts`, `comptes-espace.ts` pour la candidature et les propositions, `comptes-liens.ts` pour « Mot de passe oublié » et la confirmation de l'e-mail, `comptes-suggestions.ts` pour « Proposer une modification » d'une fiche, `pro-rattachements.ts`, `pro-fiche.ts` et `pro-equipe.ts` pour l'espace pro, attentes et limites par compte en mémoire dans `comptes-attente.ts` et `comptes-limite-envois.ts`) ; `gestion/` pour le logiciel de gestion (et la vérification de ses champs) |
| `src/services/` | logique métier ; `mesure.ts` (compteur de visites sans cookie) et `stockage-stats.ts` ; comptes de l'espace ambassadeur (`comptes.ts`, `comptes-espace.ts`, sessions dans `stockage-sessions-comptes.ts`, ménage de nuit dans `menage-comptes.ts`, et `comptes-en-memoire.ts` pour les tests) ; suggestions de modification d'une fiche envoyées par un compte (`suggestions-comptes.ts`, règles et limites dans `suggestions-comptes-regles.ts`, `suggestions-comptes-en-memoire.ts` pour les tests) ; zones des fondateurs et leurs places (`zones-fondateurs.ts`, et `zones-fondateurs-en-memoire.ts` pour les tests) ; espace pro (`pro.ts`, formes et limites dans `pro-regles.ts`, `pro-en-memoire.ts` pour les tests) ; `gestion/` pour le logiciel de gestion (accès autorisés, statistiques, newsletter et ses envois, lieux, publications, médias, modération, comptes, ambassadeurs, missions et messages, fondateurs par ville, ambassadeurs certifiés, modifications de fiches proposées, BIG SOS, notifications, maintenance, journal, alertes, recherche partout, calendrier, historique d'un lieu, statistiques de la communauté, bilan du mois, réponses types, contrôle et import des lieux, villes à lancer, test des sauvegardes, boîte de réception, rattachements pro) ; `courriels/` pour l'envoi des mails par la boîte bonjour@ (SMTP de l'hébergement mail, file d'attente, mails des comptes, mail écrit depuis le logiciel) ; `notifications/` pour l'envoi direct des notifications push (Apple APNs, Google FCM, anti-spam) ; `big-sos-publics.ts` (BIG SOS en cours, pour le site et l'app) |
| `src/middlewares/` | erreurs, limite de requêtes, protection du logiciel de gestion (signature, code à 6 chiffres, session) et ses origines autorisées, protection des comptes de l'espace ambassadeur (`proteger-comptes.ts` : session, ambassadeur validé), protection de l'espace pro (`proteger-pro.ts` : rattachement validé au lieu, gérant) |
| `src/fonctions/geo/`, `securite/`, `dates/`, `mesure/`, `texte/`, `courriels/`, `notifications/`, `big-sos/` | fonctions pures, une par fichier (signature Ed25519, code à 6 chiffres, empreinte scrypt des mots de passe, jetons de session, périodes, esquisse HyperLogLog, gabarit et nouveaux essais des mails, jetons Apple et Google, anti-spam, phase d'un BIG SOS…) ; dans `geo/`, la recherche de communes (`chercher-communes.ts` : sans accents, « st » pour « saint », code postal, arrondissements), son index préparé une fois à la demande (`charger-index-communes.ts`), la commune d'un code INSEE (`trouver-commune-par-code.ts`), telle que l'API la montre (`decrire-commune.ts`), et la lecture d'un code de commune reçu (`lire-code-commune.ts`) |
| `src/fonctions/fondateurs/` | règles des fondateurs par ville : places d'une ville selon sa population (`calculer-places-ville.ts`), code de la zone d'une commune (`calculer-code-zone.ts`), nom avec « de » pour la carte (`ecrire-nom-avec-de.ts`), construction des zones (`construire-zones-fondateurs.ts`, pour `scripts/preparer-communes.ts`), une zone et ses places telle que l'API la montre (`decrire-zone.ts`) |
| `src/fonctions/lieux/` | ce qui manque à une fiche, positions douteuses, doublons (nom simplifié, adresse, distance) |
| `src/fonctions/ambassadeurs/` | palier atteint selon les points (`calculer-palier-aux-points.ts`, mêmes seuils que `packages/commun`) |
| `src/fonctions/commun/` | ce que l'API charge de `packages/commun` tel quel, sans le recopier (`charger-valider-proposition-lieu.ts` : vérification d'une proposition de modification de fiche) |
| `src/fonctions/suggestions/` | suggestions de modification d'une fiche : garder seulement les champs qui changent (`retirer-champs-inchanges.ts`) |
| `src/fonctions/pro/` | espace pro : numéro SIRET possible (`verifier-siret.ts` : 14 chiffres, clé de Luhn, exception de La Poste), préparation d'une modification de fiche par le gérant (`preparer-modification-fiche.ts` : champs directs vérifiés par la fonction commune, effacement, nom et adresse mis à part pour l'équipe) |
| `src/fonctions/comptes/` | règles des comptes de l'espace ambassadeur : âge à la date de Paris, mot de passe acceptable (et la liste des mots de passe courants, lue une fois : `charger-mots-de-passe-courants.ts`), attente après des échecs, attente entre deux liens envoyés par mail, nettoyage des champs, erreur résumée sans donnée personnelle |
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
