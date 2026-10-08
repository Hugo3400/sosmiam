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
- **Inscription à partir de 15 ans** (sous 15 ans, le RGPD exigerait l'accord des parents). Entre 15 et 17 ans, tout ce qui touche à l'alcool (boissons alcoolisées, types de bar) est masqué. Règles dans `packages/commun/src/regles/ages.ts`.
- Première ouverture : carrousel de bienvenue qui explique le concept avec la mascotte, puis création du compte, « Fais connaissance » (prénom obligatoire, nom facultatif, date de naissance, ville), puis les envies (lieux, cuisines, boissons, types de bar, ambiance musicale, jeux, moments, régime particulier), puis « C'est prêt ».
- **Connexion : Apple, Google ou e-mail.** Il faudra un compte Apple Developer, qu'on prendra de toute façon pour l'App Store. Apple impose son bouton dès qu'on propose Google.
- **Base de données ultra sécurisée** : PostgreSQL sur le VPS, jamais exposée à Internet, rôle limité au strict nécessaire, données sensibles (date de naissance, nom, régimes) chiffrées par l'API (AES-256-GCM, clé hors de la base), sauvegardes chiffrées, journaux sans données personnelles, suppression de compte réelle.
- **Régime particulier** (végétarien, vegan, halal, casher, sans gluten, allergies…) : ces données peuvent révéler une religion ou un état de santé. Elles restent sur le téléphone tant qu'il n'y a pas d'accord explicite (RGPD, article 9) pour les envoyer au serveur.

## Programme Ambassadeurs
- Paliers : Curieux (0 pt) → Dénicheur (100) → Ambassadeur de quartier (300) → Ambassadeur de ville (sur candidature ou invitation).
- Le premier à faire découvrir un lieu : « Déniché par … » + badge « Premier sauveteur ».

## Engagements publics (FAQ)
- On peut passer faire la fiche avec le lieu (Montpellier et Hérault).
- On ne vend jamais les données des utilisateurs.
- Newsletter : on prévient du lancement, puis on continue d'envoyer des nouvelles tant que la personne ne se désinscrit pas (un simple mail suffit). Après 3 ans sans aucun message de sa part, on lui demande si elle veut continuer, sinon on efface.
- Contact : bonjour@sosmiam.fr.
- Cookies : rien de facultatif sans accord, choix gardé 6 mois.

## Outils internes
- Un **logiciel ordinateur de gestion** (Tauri) servira à administrer le site et l'app : notifications, modération, validation des BIG SOS, maintenance. Il viendra après le site et l'app ; l'administration n'est pas sur le site.
