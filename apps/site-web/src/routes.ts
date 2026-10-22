import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

// Liste des adresses du site. Chaque page a son fichier dans src/routes/<espace>/.
export default [
  // Pages publiques : même en-tête et même pied de page
  layout("routes/public/mise-en-page-publique.tsx", [
    index("routes/public/accueil.tsx"),
    route("faq", "routes/public/faq.tsx"),
    route("inscrire-mon-lieu", "routes/public/inscrire-mon-lieu.tsx"),
    route("carriere", "routes/public/carriere.tsx"),
    route("carriere/:id", "routes/public/offre-carriere.tsx"),
    route("securite", "routes/public/securite.tsx"),
    // Fiche publique d'un lieu publié (indexée), avec « Vérifié ✓ » ou « Lieu non vérifié »
    route("lieux/:id", "routes/public/fiche-lieu.tsx"),
    // QR de vitrine d'un lieu (sosmiam.fr/l/<code>) : redirige vers sa fiche, ou une petite page aimable (noindex)
    route("l/:code", "routes/public/qr-vitrine.tsx"),
    // Lien d'invitation d'un pote (sosmiam.fr/invitation/<pseudo>#c=<code>) : « Ouvre SOS Miam… » (noindex, sans appel à
    // l'API ; le code reste dans le fragment, jamais envoyé au serveur). Quand l'app est installée, le lien universel l'ouvre.
    route("invitation/:pseudo", "routes/public/invitation.tsx"),
    // QR de connexion (sosmiam.fr/q/<code>, connexion par QR code) : « Ouvre l'app SOS Miam pour te connecter » (noindex, sans
    // appel à l'API ; les statistiques ne reçoivent que « /q »). Quand l'app est installée, le lien universel l'ouvre.
    route("q/:code", "routes/public/qr-connexion.tsx"),
    // Aperçus de ce qu'on prépare pour l'app (le salon « roadmap » du Discord y renvoie) : l'accueil des aperçus, puis un
    // aperçu par page. Noindex (balise et en-tête), Disallow dans robots.txt, hors du menu, du pied de page et du plan du site.
    route("preview", "routes/public/apercus.tsx"),
    route("preview/communaute", "routes/public/apercu-communaute.tsx"),
  ]),
  // Pages légales : cadre simple, servi aussi derrière la page « Bientôt » de sosmiam.fr
  layout("routes/public/mise-en-page-legale.tsx", [
    route("mentions-legales", "routes/public/mentions-legales.tsx"),
    route("confidentialite", "routes/public/confidentialite.tsx"),
    route("cookies", "routes/public/cookies.tsx"),
    route("cgu", "routes/public/cgu.tsx"),
    route("age", "routes/public/age.tsx"),
    route("accessibilite", "routes/public/accessibilite.tsx"),
    route("prevention", "routes/public/prevention.tsx"),
    route("statistiques", "routes/public/statistiques.tsx"),
    // Lien « Me désinscrire » des mails de la newsletter (noindex) : ouvrir la page ne désinscrit pas, le bouton si
    route("desinscription", "routes/public/desinscription.tsx"),
    route("confirmer-newsletter", "routes/public/confirmer-newsletter.tsx"),
  ]),
  // Pages du compte, servies sur ambassadeur.sosmiam.fr ET sur pro.sosmiam.fr : leur cadre suit l'hôte. Le partage des
  // adresses entre sosmiam.fr et les deux espaces est fait par fonctions/hotes/choisir-redirection-hote.ts
  layout("routes/compte/mise-en-page-compte.tsx", [
    route("inscription", "routes/compte/inscription.tsx"),
    route("connexion", "routes/compte/connexion.tsx"),
    route("mot-de-passe-oublie", "routes/compte/mot-de-passe-oublie.tsx"),
    route("nouveau-mot-de-passe", "routes/compte/nouveau-mot-de-passe.tsx"),
    route("verifier-email", "routes/compte/verifier-email.tsx"),
  ]),
  // Espace ambassadeur (https://ambassadeur.sosmiam.fr, dès 18 ans) : son propre cadre
  layout("routes/ambassadeur/mise-en-page-ambassadeur.tsx", [
    route("programme", "routes/ambassadeur/programme.tsx"),
    route("espace", "routes/ambassadeur/espace.tsx"),
    route("espace/mon-compte", "routes/compte/mon-compte.tsx"),
    route("espace/kit-media", "routes/ambassadeur/kit-media.tsx"),
    route("espace/proposer-un-lieu", "routes/ambassadeur/proposer-un-lieu.tsx"),
    route("espace/fondateur", "routes/ambassadeur/fondateur.tsx"),
    route("espace/certification", "routes/ambassadeur/certification.tsx"),
    route("espace/kit-media-pro", "routes/ambassadeur/kit-media-pro.tsx"),
    route("espace/carte-de-visite", "routes/ambassadeur/carte-de-visite.tsx"),
    route("espace/missions", "routes/ambassadeur/missions.tsx"),
    route("espace/messages", "routes/ambassadeur/messages.tsx"),
  ]),
  // Espace pro (https://pro.sosmiam.fr) : les lieux gèrent leur fiche, leur carte, leur équipe et leur affichette de table
  layout("routes/pro/mise-en-page-pro.tsx", [
    route("bienvenue", "routes/pro/bienvenue.tsx"),
    route("tableau", "routes/pro/tableau.tsx"),
    route("rattacher/:id?", "routes/pro/rattacher.tsx"),
    route("lieu/:id", "routes/pro/ma-fiche.tsx"),
    route("lieu/:id/carte", "routes/pro/ma-carte.tsx"),
    route("lieu/:id/suggestions", "routes/pro/suggestions.tsx"),
    route("lieu/:id/equipe", "routes/pro/equipe.tsx"),
    route("lieu/:id/affichette", "routes/pro/affichette.tsx"),
    route("lieu/:id/vitrine", "routes/pro/vitrine.tsx"),
    route("lieu/:id/chevalet", "routes/pro/chevalet.tsx"),
    route("lieu/:id/miam-safe", "routes/pro/miam-safe.tsx"),
    route("lieu/:id/kit", "routes/pro/kit.tsx"),
  ]),
  // « Mon compte » : la même page que /espace/mon-compte (son propre id). Une seule adresse, deux espaces : sur
  // pro.sosmiam.fr, celui de l'espace pro (cadre pro) ; sur sosmiam.fr, celui du site principal (cadre public, connexion
  // dans la page, « Mes données », suppression sans se connecter : l'adresse donnée aux stores). Le cadre suit l'hôte.
  layout("routes/compte/mise-en-page-mon-compte.tsx", [
    route("mon-compte", "routes/compte/mon-compte.tsx", { id: "routes/compte/mon-compte-site-et-pro" }),
  ]),
  // « Continuer avec Apple / Google » (sur les trois hôtes) : départ vers le fournisseur, retour en POST depuis son site,
  // et « Finir ton inscription » quand le compte n'existe pas encore (services/connexion-externe.server.ts)
  route("connexion/finir-inscription", "routes/compte/finir-inscription.tsx"),
  // « Me connecter avec l'app » (connexion par QR code, sur les trois hôtes) : le QR demandé au clic, puis l'attente que le
  // navigateur interroge toutes les 2 s (services/connexion-qr.server.ts)
  route("connexion/qr", "routes/ressources/connexion-qr-depart.ts"),
  route("connexion/qr/attente", "routes/ressources/connexion-qr-attente.ts"),
  route("connexion/:fournisseur", "routes/ressources/connexion-externe-depart.ts"),
  route("connexion/:fournisseur/retour", "routes/ressources/connexion-externe-retour.ts"),
  // Déconnexion : une page à part entière (formulaire POST vérifié par React Router, l'adresse seule redirige vers /espace),
  // et les fichiers du kit média, réservés aux ambassadeurs validés
  route("deconnexion", "routes/compte/deconnexion.tsx"),
  // Choix des cookies (bandeau, panneau « Choisir », /cookies#mes-choix), avec ou sans JavaScript : POST servi sur les trois
  // hôtes (le cookie du choix vaut pour sosmiam.fr et ses espaces), GET renvoyé vers /cookies#mes-choix
  route("cookies/choix", "routes/ressources/choix-cookies.ts"),
  route("kit-media/:fichier", "routes/ressources/telecharger-kit.ts"),
  // Fichiers du kit média pro, réservés aux ambassadeurs certifiés
  route("kit-media-pro/:fichier", "routes/ressources/telecharger-kit-pro.ts"),
  // Fichiers du kit média des lieux, réservés aux comptes rattachés à un lieu (espace pro)
  route("kit-media-lieux/:fichier", "routes/ressources/telecharger-kit-lieux.ts"),
  // Carte de fondateur numérique (SVG), réservée à son fondateur
  route("espace/fondateur/carte.svg", "routes/ressources/carte-fondateur.tsx"),
  // Visuels du kit média à leur taille exacte, pour les capturer (serveur de développement seulement)
  route("rendu-kit/:visuel", "routes/ressources/rendu-kit.tsx"),
  // Affiche et flyer du kit média pro à leur taille exacte, en PNG et en PDF (serveur de développement seulement)
  route("rendu-kit-pro/:visuel", "routes/ressources/rendu-kit-pro.tsx"),
  // Visuels du kit média des lieux à leur taille exacte, en PNG et en PDF (serveur de développement seulement)
  route("rendu-kit-lieux/:visuel", "routes/ressources/rendu-kit-lieux.tsx"),
  // Mini-site des liens (bio TikTok et Instagram) : son propre cadre, servi aussi derrière la page « Bientôt »
  route("liens", "routes/public/liens.tsx"),
  // Boutons de /liens : compte le clic (statistiques, sans cookie), puis redirige vers le réseau
  route("liens/aller/:reseau", "routes/ressources/aller-lien.ts"),
  // Adresses sans page, appelées par le navigateur (réponses JSON)
  route("localiser", "routes/ressources/localiser.ts"),
  route("communes", "routes/ressources/communes.ts"),
  route("recherche-lieux", "routes/ressources/recherche-lieux.ts"),
  // Pour les moteurs de recherche (texte et XML générés à chaque demande)
  route("robots.txt", "routes/ressources/robots.ts"),
  route("sitemap.xml", "routes/ressources/plan-du-site.ts"),
  // Liens universels de l'app (sosmiam.fr seulement, 404 ailleurs) : iOS, et Android dès que son empreinte est réglée
  route(".well-known/apple-app-site-association", "routes/ressources/association-apple.ts"),
  route(".well-known/assetlinks.json", "routes/ressources/liens-android.ts"),
  route(".well-known/security.txt", "routes/ressources/fichier-security-txt.ts"),
  // Toute autre adresse : « Page introuvable » (404). Sans cette route, une adresse inconnue ne passe par aucun
  // middleware de root.tsx (ni le partage des hôtes, ni les statistiques) : React Router répond 404 avant eux.
  // Elle reste la DERNIÈRE de la liste (tests/route-introuvable.test.ts).
  route("*", "routes/public/introuvable.tsx"),
] satisfies RouteConfig;
