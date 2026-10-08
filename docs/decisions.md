# Décisions produit

## Concept
- Faire découvrir les lieux indépendants (restos, pâtisseries, bars, bowlings, salles d'événements, sorties) qui ont besoin de monde, y compris ceux en vraie difficulté.
- Lancement à **Montpellier et dans l'Hérault**, puis ville par ville.
- L'utilisateur a **3 rescousses par semaine** (rechargées le lundi) et valide ses visites par **QR code**.

## Modèle économique (changé le 8 octobre 2026)
- **Tout est gratuit**, pour les utilisateurs comme pour les lieux : fiche, avis vérifiés, SOS « place ce soir », statistiques, événements. **Pas d'abonnement Pro.**
- **Aucune commission** sur les réservations.
- Financement : **publicité toujours signalée**, sans effet sur le classement. Pas de pub pour l'instant ; elle arrivera avec le bandeau de consentement aux cookies.
- Statut : pas d'entreprise tant que rien ne rapporte. Hugo édite le site à titre non professionnel (mentions légales avec son nom, sans adresse ni téléphone). Dès que de la pub rémunérée sera mise en place (contrat avec une régie, réseau publicitaire activé), il faudra une structure (micro-entreprise ou société) et des mentions légales complètes, **avant** ce démarrage.
- Abandonné : le Pro à 10,99 €/mois et l'offre « Pro offert 6 mois aux 50 premiers lieux ».

## BIG SOS
- Un lieu en vraie difficulté passe **à la une 7 jours**.
- Parcours : demande du lieu (espace pro) ou proposition d'un ambassadeur → vérification sur place par un ambassadeur → vote de la communauté → validation admin → à la une → bilan.
- Page : histoire racontée par le lieu, vidéos de créateurs + liens, objectif de mobilisation avec jauge, bons solidaires.
- **BIG SOS gratuit, mais limité** (décidé le 8 octobre 2026). Les limites restent à définir (nombre, fréquence…) : n'en annoncer aucune tant qu'elles ne sont pas décidées.
- Point ouvert : que devient un bon solidaire si le lieu ferme.

## Comptes et données de l'app (décidé le 8 octobre 2026)
- **Inscription à partir de 15 ans** (sous 15 ans, le RGPD exigerait l'accord des parents). **Anti-contournement (décidé le 8 octobre 2026)** : le choix de la date reste neutre (toutes les dates, pas d'annonce de l'âge minimum à côté du champ) ; continuer avec une date qui donne moins de 15 ans (écrite en toutes lettres dans le champ, donc on a pu corriger une faute de frappe) bloque l'inscription sur le téléphone jusqu'aux 15 ans (verrou dans le Trousseau ou le Keystore, qui garde le jour des 15 ans, ce qui revient à garder la date de naissance, uniquement sur le téléphone et jamais envoyé), même si on revient changer la date. Sur iPhone, le verrou survit à une désinstallation. Limite connue : le verrou suit l'horloge du téléphone, donc avancer la date le lève ; il sera vérifié avec l'heure du serveur quand l'API sera branchée. Aucune vérification d'identité : c'est une barrière, pas une preuve. Un bouton « Débloquer » existe seulement en mode développement (Expo Go), jamais dans l'app publiée. Entre 15 et 17 ans, tout ce qui touche à l'alcool (boissons alcoolisées, types de bar) est masqué. Règles dans `packages/commun/src/regles/ages.ts`.
- Première ouverture : carrousel de bienvenue qui explique le concept avec la mascotte, puis création du compte, « Fais connaissance » (prénom obligatoire, nom facultatif, date de naissance, ville : avec la position du téléphone, lue une seule fois et jamais gardée, ou tapée à la main avec nos villes de lancement en suggestion), puis les envies (lieux, cuisines, boissons, types de bar, ambiance musicale, jeux, moments, régime particulier), puis « C'est prêt ».
- **Connexion : Apple, Google ou e-mail.** Il faudra un compte Apple Developer, qu'on prendra de toute façon pour l'App Store. Apple impose son bouton dès qu'on propose Google.
- **Base de données ultra sécurisée** : PostgreSQL sur le VPS, jamais exposée à Internet, rôle limité au strict nécessaire, données sensibles (date de naissance, nom, régimes) chiffrées par l'API (AES-256-GCM, clé hors de la base), sauvegardes chiffrées, journaux sans données personnelles, suppression de compte réelle.
- **Régime particulier** (végétarien, vegan, halal, casher, sans gluten, allergies…) : ces données peuvent révéler une religion ou un état de santé. Elles restent sur le téléphone tant qu'il n'y a pas d'accord explicite (RGPD, article 9) pour les envoyer au serveur.

## Signalements et modération (décidé le 8 octobre 2026)
- Dans l'app, le menu « ⋯ » d'une publication → **Signaler** : une raison (faux lieu, pub cachée, arnaque, haine, violence ou contenu sexuel, danger, vie privée, contenu volé, autre chose), une précision facultative, puis le pourquoi avec ses mots (obligatoire pour « Autre chose »). Liste dans `apps/app-mobile/src/contenus/raisons-signalement.ts`, règles dans `packages/commun/src/regles/signalement.ts`.
- **Violence ou contenu sexuel : la publication est masquée pour tout le monde dès le premier signalement**, et une **alerte de modération arrive dans le logiciel de gestion**. Un modérateur décide **à la main**, dans le logiciel de gestion : signalement retenu → la publication est retirée pour de bon ; rejeté → elle est remise en ligne.
- Les autres raisons ne masquent la publication que pour la personne qui signale, en attendant la modération.
- Pour les contenus graves (haine, violence, danger), l'app rappelle le 17, le 112 et Pharos.
- **Promis dans les CGU (8 octobre 2026), à coder avant la sortie de l'app** : quand une publication est masquée ou retirée, ou un compte limité, on prévient l'auteur et on lui dit pourquoi ; s'il conteste, on réexamine la décision ; la personne qui a signalé apprend ce qu'on a décidé (règlement européen sur les services numériques).
- Points ouverts : garde-fous contre les signalements abusifs (un concurrent qui ferait masquer les vidéos d'un lieu) ; délai de traitement.

## Publications et compte (CGU du 8 octobre 2026)
- Les publications restent à leur auteur : SOS Miam peut seulement les héberger, les adapter au format et les montrer dans l'app et sur le site. **Pour les reprendre ailleurs (nos réseaux TikTok, Instagram…), on demande d'abord l'accord de l'auteur.**
- Un compte par personne ; suppression possible **depuis l'app** (exigé par Apple, à coder) ou par e-mail.
- Âge : page publique https://sosmiam.fr/age (« URL d'adéquation à l'âge » de l'App Store, classification 16+). À mettre à jour avec les CGU **avant** l'arrivée de la messagerie et de la pub.

## Programme Ambassadeurs
- Paliers : Curieux (0 pt) → Dénicheur (100) → Ambassadeur de quartier (300) → Ambassadeur de ville (sur candidature ou invitation).
- **Deux badges distincts (décidé le 8 octobre 2026)** : « 🚀 Premier sauveteur » = donner la toute première rescousse à un lieu qui vient d'arriver (+20 points) ; « 🔎 Déniché par toi » = proposer un lieu qui rejoint SOS Miam, sa fiche affiche « Déniché par <prénom> » (+30 points, « proposer un lieu validé »).
- **Barème des points (décidé le 8 octobre 2026)** : visite validée +15, visite pendant un SOS +25, avis avec photo +10, proposer un lieu validé +30, corriger une fiche +5, premier sauveteur +20, **rescousse +2**. Les défis réussis rapportent leurs propres points. Règles dans `packages/commun/src/regles/ambassadeurs.ts`.
- Écran Profil de l'app : avatar (emoji au choix, ou photo gardée sur le téléphone), palier et points, rescousses de la semaine, défis, badges, lieux gardés et publications aimées, réglages (infos, envies, notifications, confidentialité, tout effacer). La date de naissance ne se change pas depuis l'app (règle d'âge) : tant que tout est sur le téléphone, la seule façon de la corriger est « Effacer mes données et recommencer ».

## Engagements publics (FAQ)
- On peut passer faire la fiche avec le lieu (Montpellier et Hérault).
- On ne vend jamais les données des utilisateurs.
- Newsletter : on prévient du lancement, puis on continue d'envoyer des nouvelles tant que la personne ne se désinscrit pas (un simple mail suffit). Après 3 ans sans aucun message de sa part, on lui demande si elle veut continuer, sinon on efface.
- Contact : bonjour@sosmiam.fr.
- Cookies : rien de facultatif sans accord, choix gardé 6 mois.

## Outils internes
- **Logiciel ordinateur de gestion** (Tauri, Windows), commencé le 8 octobre 2026 : statistiques, newsletter, lieux, publications du fil, modération, maintenance (BIG SOS, notifications et comptes à venir). L'administration n'est pas sur le site.
- **Réservé à Hugo** (décidé le 8 octobre 2026) : clé secrète propre à chaque PC, chiffrée par un mot de passe, **et** code à 6 chiffres d'une application d'authentification. Le serveur ne connaît que les clés publiques des postes autorisés ; chaque demande est signée. Seul le chemin `/api-gestion` de l'API est joignable de l'extérieur.
- L'installateur est construit sur le serveur (comme TabulaDB), sans passer par GitHub ; depuis la 0.2.0, le logiciel **se met à jour tout seul** (installateurs signés, servis seulement à un poste connecté).
- **Sauvegardes** : copie chiffrée de la base chaque nuit sur le serveur, 30 gardées ; clé de restauration notée par Hugo dans son gestionnaire de mots de passe.
- **Demandes de lieux** : les lieux s'inscrivent sur le site (/inscrire-mon-lieu), la communauté propose sur Discord (/proposer-lieu) ; tout arrive dans le logiciel, où Hugo accepte (fiche créée en brouillon) ou refuse. Contacts effacés automatiquement 3 ans après.
- **Annonces Discord** écrites dans le logiciel, publiées par le bot (salon choisi avec `/config annonces`).
- Newsletter : le logiciel gère les inscrits et la rédaction ; **l'envoi arrivera avec Brevo** (pas d'envoi en masse par la boîte de l'hébergeur).
- Les fiches des lieux et les publications du fil sont désormais dans la base, saisies dans le logiciel ; l'app les lira quand elle sera branchée à l'API.

## Statistiques de visite (décidé le 8 octobre 2026)
- Le site compte ses visites **côté serveur, sans cookie ni script** : pages vues, visites, visiteurs uniques par jour, semaine, mois et année, pages, provenances, appareils, navigateurs, systèmes, pays. Seulement des totaux, jamais d'adresse IP.
- Visiteurs uniques : empreinte brouillée par un secret propre à chaque période, qui ne sert qu'à une esquisse HyperLogLog ; secret et esquisse effacés à la fin de la période. Détail par jour effacé au bout de 25 mois (conditions d'exemption de consentement de la CNIL).
- Pas comptés : robots, préchargements, aperçu, signaux « Global Privacy Control » et « Do Not Track », et les personnes qui le refusent sur la page `/statistiques` (cookie de refus, 13 mois).
- Plus tard, l'app enverra ses statistiques de la même façon (source « app »).
