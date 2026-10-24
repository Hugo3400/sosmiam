# Version anglaise de SOS Miam : le plan de référence

Préparé le 24 octobre 2026 avec Hugo. À donner à chaque session et à chaque agent qui touche à un texte, avec
[glossaire-anglais.md](glossaire-anglais.md) et `kits/SOS_Miam_kit_de_marque/LISEZMOI.txt`. Les choix de Hugo sont dans
[decisions.md](decisions.md), section « Version anglaise ». L'état des lieux chiffré du 24/10 est dans
`temporaire/version-anglaise/etat-des-lieux.json` (hors git).

## 1. Ce qu'on fait, en une phrase

L'app, le site public et les modes pro et ambassadeur existent aussi en anglais britannique, pour les visiteurs et les
expats en France. L'app reste ouverte en France seulement. Le français reste la langue de référence.

## 2. L'état des lieux (24/10)

| Partie | Volume à traduire | Ce qui pèse |
|---|---|---|
| App | ~6 200 chaînes, ~43 600 mots | 3 766 chaînes écrites en dur dans 466 fichiers ; seules 1 186 sont dans les 27 `contenus/textes-*.ts` |
| Site | ~70 200 mots | 80 % déjà dans `src/contenus` ; ~14 100 mots en dur dans ~270 fichiers ; 76 adresses |
| Légal (site) | ~40 000 mots | Change sans cesse (105 commits depuis le 1er octobre) |
| Serveur et commun | 184 messages d'erreur, 15 sources de push (~45 variantes), 10 e-mails | Les erreurs sont déjà des codes : bonne base |
| Hors périmètre | | Logiciel de gestion, bot Discord, presse, kit de marque, affiches des lieux : en français |

Aujourd'hui, rien n'est prêt : pas de détection de langue, pas de colonne `langue` en base, `<html lang="fr">` en dur.

## 3. L'architecture

### 3.1 Les dictionnaires

- **Dictionnaires TypeScript maison**, sans bibliothèque (ni i18next, ni Lingui). Même schéma dans l'app, le site,
  `packages/commun` et l'API.
- **Le français reste la source** : les fichiers `contenus/textes-*.ts` ne changent pas de forme.
- **L'anglais vit dans un dossier parallèle `contenus/anglais/`**, sous le même nom de fichier. Le dossier s'appelle
  `anglais/`, pas `en/` (règle des noms en français).
- **Le type `Traduction<typeof TEXTES_X>`** (dans `packages/commun/src/types/traduction.ts`) élargit les littéraux en
  `string` et garde la signature des fonctions `(n: number) => …`. Une clé oubliée ou en trop ne compile pas.
- **Les deux langues sont rassemblées par paire** : le fichier français exporte aussi
  `TEXTES_X_PAR_LANGUE = { fr: TEXTES_X, en: TEXTES_X_ANGLAIS }`.
- **La lecture se fait différemment selon le code** :
  - les composants lisent `const T = utiliserTextes(TEXTES_X_PAR_LANGUE)` ;
  - hors de React, on appelle `choisirTextes(paire, langue)` (`packages/commun/src/fonctions/langue/choisir-textes.ts`).
- **Jamais `{ fr, en }` dans un seul gros fichier** : on dépasserait les 500 et 700 lignes.
- **Ce qui ne se traduit pas sort des dictionnaires** : icônes, couleurs, chemins.

### 3.2 La langue dans l'app

- **Détection.** `expo-localization`, un module natif, donc un build. La règle est
  `choisir-langue-appareil.ts` : la première langue `fr` ou `en` de la liste ordonnée du téléphone, sinon `fr`. Un
  téléphone en espagnol qui a l'anglais en deuxième langue reçoit l'anglais.
- **Réglage.** Paramètres › Langue (`app/reglages/langue.tsx`) propose Automatique, Français, English, chaque choix
  écrit dans sa propre langue. Il est gardé dans `stockage/langue.ts` (clé `sosmiam.langue`).
- **Sans redémarrer.** `composants/langue/FournisseurLangue.tsx` est calqué sur `FournisseurTheme`. Il est monté
  au-dessus de `FournisseurSession`, et la langue est lue avant de cacher l'écran de démarrage, donc sans flash de
  français.
- **Le code hors React.** Le magasin `services/langue-actuelle.ts` sert les clients HTTP, la catégorie « Répondre » et
  les 4 canaux Android, réenregistrés à chaque changement.
- **Interrupteur.** `LANGUES_OUVERTES_APP = ["fr"]` dans `packages/commun/src/regles/langues.ts`. Tant que l'anglais
  n'y est pas, la règle rend `fr`, et l'écran Langue n'apparaît que dans les Coulisses de la démo.
- **Ressources natives, dans le seul build d'ouverture** : les 8 textes de permission (clé `locales` d'app.json), les
  langues déclarées (iOS et Android 13+) et `CFBundleDevelopmentRegion` à `fr`. Tout est à vérifier dans la doc Expo
  v57. Les fenêtres système suivent la langue d'iOS, pas le réglage de l'app : c'est une limite connue. Ces écrans ne
  s'essaient pas dans Expo Go, il faut TestFlight ou un build de développement.
- **Le pays ne vient jamais de la langue.** On ne déduit jamais le pays d'un compte (âge, ouverture) de la région du
  téléphone : `en-US` ne veut pas dire « États-Unis » pour `AGES_MAJORITE`.

### 3.3 La langue côté serveur

- **L'en-tête de demande.** L'app envoie un en-tête maison `X-Langue`, posé par `client-http.ts` à côté de
  `X-Version-App`, et réservé. Un middleware `poserLangue` le lit dans un AsyncLocalStorage, sur le modèle de
  `middlewares/app-cliente.ts`. En-tête absent ou inconnu : `fr`.
- **Le site** n'utilise pas `creerClientHttp`. Une fonction unique de ses `services/*.server.ts` ajoute `X-Langue` à
  tous les `fetch` vers l'API, avec un essai.
- **La langue enregistrée.** Une migration additive ajoute `langue VarChar(5) NOT NULL DEFAULT 'fr'` sur `comptes`,
  `appareils_push`, `inscriptions_newsletter` et `confirmations_newsletter`. Elle est essayée sur PGlite, puis appliquée
  par Site.
- **Le téléphone** envoie sa langue avec `PUT /app/appareils`, à chaque inscription.
- **Le compte** reçoit une langue à l'inscription, puis ne change que sur un choix explicite : Paramètres › Langue
  dans l'app, ou le sélecteur du site quand on est connecté. Une simple demande ne modifie jamais `comptes.langue` (un
  essai le vérifie).
- **Les notifications** sont rédigées dans la langue de chaque téléphone qui reçoit. `prevenirCompte` accepte un
  rédacteur `(langue) => MessagePush`. Jamais la langue de l'expéditeur.
- **Les e-mails** suivent `comptes.langue`, ou la langue de l'inscription à la newsletter.
  - Leurs liens (confirmation de la newsletter, désinscription, vérification de l'e-mail, mot de passe) portent
    `?langue=xx`, celle de l'e-mail : la page s'ouvre dans la langue du message, quel que soit le navigateur.
  - La newsletter elle-même est écrite à la main : deux versions, ou le français pour tous ? C'est une décision de
    Hugo, à prendre à l'étape 7. La confirmation et le mot de désinscription suivent toujours la langue.
- **Les réponses restent des codes** : le texte des erreurs vient de `MESSAGES_SERVICE_PAR_LANGUE` côté client.
- **Les anciennes apps (1.0.0 à 1.0.2) reçoivent exactement la même chose qu'aujourd'hui.** Aucune réponse en cache
  public ne varie selon la langue : Cloudflare ne tient pas compte de `Vary`.
  - Le `texte` des lieux ne change pas, ligne « 📚 Texte et infos » comprise. On AJOUTE des champs que seule la
    nouvelle app lit.
  - Les messages de SOS Miam (rappel de sortie, sondage clos) et la question du sondage gardent leur texte enregistré.
    La nouvelle app écrit le sien à partir du code `systeme` et de données ajoutées. Leurs textes vivent dans
    `packages/commun/src/contenus` (et `contenus/anglais/`), jamais en double dans l'API et l'app.

### 3.4 Les adresses du site

- **`/en` seulement pour les pages faites pour les moteurs de recherche** : l'accueil, la FAQ, les pages légales,
  carrière, sécurité et inscrire-mon-lieu, si elles sont traduites. Les adresses gardent leurs noms français :
  `/en/confidentialite`, `/en/cgu`, `/en/faq`.
- **Les deux pages publiques des espaces** suivent la même règle sur leur sous-domaine, avec hreflang :
  ambassadeur.sosmiam.fr/en/programme et pro.sosmiam.fr/en/bienvenue. Le reste des espaces garde une adresse unique.
- **Une seule adresse pour tout le reste** : les fiches des lieux (`/lieux/:id`, dont le texte reste en français), les
  espaces, « Mon compte », `/l`, `/q`, `/invitation`, `/connexion/*`.
  - Leur langue vient, dans l'ordre, de `?langue=en`, du cookie `sosmiam-langue`, de la langue du compte, de
    Accept-Language, sinon `fr`.
  - Ces adresses ne portent pas de hreflang.
  - Une fiche de lieu dont la langue dépend de la personne passe en `Cache-Control: private`. Sa canonique reste
    `/lieux/:id`, sans `?langue`, et elle reste en noindex tant que la règle du 23/10 s'applique (fiche importée et non
    vérifiée).
- **Le cookie `sosmiam-langue`** vaut pour sosmiam.fr, ambassadeur. et pro. :
  - `Domain=.sosmiam.fr`, sans préfixe `__Host-` ;
  - `SameSite=Lax`, durée d'un an ;
  - choisi par la personne, c'est une préférence d'interface exemptée de consentement, déclarée sur /cookies.
- **Les routes.** Dans `routes.ts`, les routes publiques et légales servent deux fois, à la racine et sous
  `prefix("en", …)`, avec des id explicites `"en/…"`. Une 404 `en/*` passe juste avant le `*` final.
- **Le garde.** `/en` répond 404 sur sosmiam.fr tant que `LANGUES_OUVERTES_SITE` ne contient pas `en`. Il est servi sur
  apercu.sosmiam.fr, qui est déjà en noindex. L'aperçu et sosmiam.fr sont le MÊME processus (127.0.0.1:5191).
- **À l'ouverture** :
  - hreflang fr, en et x-default, dans le head et dans `sitemap.xml` ;
  - `<html lang>` suit la langue de la page, les données structurées (JSON-LD) ont leur `inLanguage`, et la 404 est
    traduite sous `/en` ;
  - les erreurs des formulaires (carrière, chasse aux bugs, newsletter, comptes) passent par
    `MESSAGES_SERVICE_PAR_LANGUE` ;
  - un canonical par langue, `og:locale` en_GB, une image de partage anglaise ;
  - un bandeau discret « This page is also in English », avec un choix mémorisé par cookie (déclaré sur /cookies) ;
  - jamais de redirection automatique selon la langue du navigateur.
- **Le poids des pages.** Le légal, la FAQ et les longs textes sont choisis par le loader, depuis un module `.server` :
  ils ne doublent pas le JavaScript du client.
- **Nginx.** Il faut des blocs de taille d'envoi pour `^/(en/)?securite(\.data)?$` et `^/(en/)?carriere/[^/]+(\.data)?$`.
  Site les prépare et les essaie avec `nginx -t`. Les changements dans `/etc` restent lancés par Hugo. Les masques des
  journaux et des statistiques acceptent un `/en` en filet.

### 3.5 Formats, grammaire, typographie

- **Des fonctions maison partagées** dans `packages/commun/src/fonctions/langue/`, une par fichier, toujours à l'heure
  de Paris. Pas d'Intl pour l'affichage : Node, Hermes et le navigateur ne rendent pas la même chose.
  - `formater-heure-langue.ts` : « 21h30 » ou « 21:30 » (24 h en anglais aussi) ;
  - `formater-prix-langue.ts` : « 4,50 € » ou « €4.50 » ;
  - `ecrire-date-langue.ts` : « 1er mars 2004 » ou « 1 March 2004 » ;
  - `ecrire-il-y-a.ts` : « il y a 5 min » ou « 5 min ago » ;
  - `formater-nombre-court-langue.ts` : « 1,2 k » ou « 1.2k » ;
  - `contenus/calendrier.ts` : jours et mois par langue.
- **Les distances restent en km.**
- **Les pluriels sont des phrases entières par langue**, avec l'aide `accorder(n, langue, un, plusieurs)` : en
  français, 0 et 1 sont au singulier ; en anglais, seul 1. `eliderDe`, `direChezLieu`, `listerPrenoms` et les morceaux
  recollés deviennent des phrases complètes par langue.
- **La typographie.**
  - `lierPonctuation` ne change pas : en anglais correct, il n'y a pas d'espace devant `? ! : ;`.
  - Les citations « » passent par `citer(texte, langue)`, qui rend “ ” en anglais.
  - « n° 3 » devient « #3 ».
  - Les chemins d'écran (« Paramètres › Messages ») sont construits avec les libellés du dictionnaire.
- **Les contenus en français** (fiches, avis, messages) sont balisés `lang="fr"` sur le site et
  `accessibilityLanguage="fr-FR"` dans l'app, pour une bonne lecture par les lecteurs d'écran.

### 3.6 Filtres et règles métier en anglais, avant l'ouverture

- **Mots interdits.** Ajouter les insultes anglaises à `mots-interdits.ts`, et corriger ses faux positifs sur des mots
  anglais ou des prénoms : « Quick Bite », « Con » (Connor).
- **Alcool.**
  - Ajouter les mots anglais (beer, wine, pint, cider, lager, ale, prosecco, shots, drinks…) à `parle-d-alcool.ts` et
    à `regles/fidelite.ts`.
  - Ajouter les formules anglaises d'open bar (« bottomless », « all you can drink », « free bar ») à
    `EXPRESSIONS_OPEN_BAR`.
  - Le logiciel a sa propre détection d'alcool (`apps/logiciel-gestion/src/fonctions/pop-ups/parle-d-alcool.ts`) :
    Logiciel la complète en même temps.
- **Recherche de lieux.** Des synonymes anglais renvoient vers le français (bakery → boulangerie).
- **GIPHY.** Il reçoit la langue de la personne (`lang`), qui entre aussi dans la clé du cache.
- **Connexion Apple et Google.** Les boutons reprennent mot pour mot les formules imposées (« Sign in with Apple » ou
  « Continue with Apple », pareil pour Google).

## 4. Les sujets sensibles

- **Miam Safe.**
  - La phrase « Le Capitaine est là ? » et la consigne pour l'équipe restent EN FRANÇAIS. Le visiteur voit la
    traduction et une aide de prononciation.
  - Dans l'app anglaise, le 112 (numéro européen) passe en premier.
  - Le SMS au 114 est à vérifier depuis une carte SIM étrangère avant l'ouverture.
  - Aucune légèreté sur ces écrans.
- **Loi Évin.** La formule française reste mot pour mot, avec la traduction juste en dessous.
- **BIG SOS.** Dignité, jamais de misérabilisme, comme en français.
- **18 ans.** On écrit « 18+ » ; jamais « teen » ni « minor » pour un compte. Un touriste s'inscrit comme tout le
  monde : « Où es-tu en France ? » (« Where are you staying in France? »), la ville où il séjourne, qu'il change quand
  il bouge.
- **Légal.**
  - Une traduction de courtoisie, avec le bandeau « Only the French version is legally binding ».
  - Les mêmes id de section (ancres publiques) et la même date que le français. Un essai de Site compare aussi la liste
    des sections et le nombre de puces de chaque liste, pour attraper une retouche oubliée.
  - Confidentialité et CGU d'abord, puisque l'app les ouvre ; le reste avant l'ouverture du site.
  - Chaque retouche du français est reportée en anglais le jour même.
  - La politique de confidentialité dit que la langue est gardée (compte, téléphone, newsletter).
- **Modération (DSA, art. 17).** Les motifs sont écrits à la main en français. Le logiciel affichera la langue du compte,
  pour écrire un motif compréhensible à un anglophone. Il reste en français au début, choix de Hugo.
- **Pays de distribution.** L'Union européenne et la Suisse d'abord. Le Royaume-Uni et les États-Unis seulement après un
  avis juridique (loi britannique sur la sécurité en ligne, lois américaines sur l'âge). Élargir la distribution
  n'ouvre aucun pays dans l'app : `AGES_MAJORITE = { FR: 18 }` ne change pas.

## 5. Le plan, étape par étape

| # | Étape | Qui | Ordre de grandeur |
|---|---|---|---|
| 0 | Glossaire validé par Hugo, règles du dépôt mises à jour (CLAUDE.md §2, §3 et §5, decisions.md, arborescence) | Hugo avec App | 1 séance |
| 1 | Socle partagé dans packages/commun (langues, types, fonctions de langue et de format, en-tête, erreurs par langue) | App, la forme validée par Site | 1,5 à 2 jours |
| 2 | Socle de l'app (expo-localization et build, fournisseur, réglage, clients HTTP, canaux) et un premier écran modèle | App | 2 à 3 jours |
| 3 | Socle du serveur (middleware, migration, appareils, compte, rédacteurs de push) | Site (migration, comptes) et App (appareils, push) | 1,5 à 2 jours |
| 4 | Extraction des textes de l'app, zone par zone, sans changer un mot du français | App | 2 à 3 semaines |
| 5 | Socle et extraction du site (routes /en, garde, langue, référencement) | Site | 2 à 3 jours, puis 4 à 6 jours |
| 6 | Traduction de l'interface (app, commun, site), relue par lots | App et Site, relecture de Hugo et d'un anglophone | 4 à 6 jours, plus la relecture |
| 7 | Le serveur dans la langue de chacun (push, messages de SOS Miam, GIPHY, filtres, recherche, e-mails) | App (social, push) et Site (e-mails, newsletter) | 3 à 4 jours |
| 8 | Le légal en anglais | Site | 3 à 5 jours |
| 9 | Build natif, essais sur téléphone (fr, en, et un téléphone en espagnol avec l'anglais en 2e) | App, puis Stores pour l'envoi | 1 jour |
| 10 | Vérification et ouverture : l'app d'abord, puis le site | App et Site, nginx par Hugo | 2 à 3 jours |
| 11 | Stores : pays de distribution (UE et Suisse) maintenant ; fiches anglaises plus tard | Stores | 15 min, puis 2 à 3 jours |

L'anglais reste invisible jusqu'à l'étape 10, puis il s'ouvre d'un coup. L'extraction part sans risque dans les
versions intermédiaires, en français.

Les mises à jour à chaud (EAS Update) ne portent jamais le premier import d'`expo-localization` vers une version
installée qui n'a pas ce module. Grâce à `runtimeVersion` en `appVersion`, la langue n'arrive qu'avec un nouveau numéro
de version et son build.

## 6. Les règles pour chaque nouveau texte (dès l'étape 1)

- Aucun texte affiché n'est écrit en dur dans un composant ou une fonction. Le français va dans `contenus/`, l'anglais
  dans `contenus/anglais/`, sous le même nom de fichier.
- Les fonctions qui rédigent du texte prennent la langue en paramètre obligatoire, sans valeur par défaut. Les essais
  passent `"fr"` et ajoutent des cas `"en"`.
- Un essai par paire de dictionnaires refuse une chaîne anglaise vide, ou identique au français hors liste des noms de
  marque et des textes qui restent en français.
- Le compteur de chaînes en dur est rangé dans `scripts/`, avec ses exceptions explicites : phrase Miam Safe, loi
  Évin, noms de marque, villes. Il se lance comme `verifier:lignes`.
- Les nouveautés (`nouveautes-versions.ts`) s'écrivent dans les deux langues. La date passe par la fonction de date.

## 7. Les risques à surveiller

- Montrer un anglais à moitié fait à un relecteur Apple : c'est le rôle de l'interrupteur `LANGUES_OUVERTES_APP`.
- Publier `/en` trop tôt : c'est le rôle du garde du site, puisque l'aperçu et sosmiam.fr sont le même processus.
- Casser le français pendant l'extraction : un mot changé, une annonce au lecteur d'écran perdue. On travaille zone par
  zone, avec les essais français inchangés.
- Changer le comportement des apps déjà installées : sans `X-Langue`, tout reste identique.
- Envoyer un push dans la langue de l'expéditeur, ou servir une réponse en cache dans la langue d'un autre.
- Laisser le légal anglais prendre du retard sur le français.
- Ouvrir avec des filtres qui ne connaissent que le français.
- Faire diverger le glossaire entre sessions : il n'y a qu'un fichier, donné à chaque agent.
- Rendre la relecture de Hugo trop lourde (~52 000 mots d'interface, ~40 000 de légal) : on relit par lots, le légal
  en dernier.
