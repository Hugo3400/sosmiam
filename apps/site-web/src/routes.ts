import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

// Liste des adresses du site. Chaque page a son fichier dans src/routes/<espace>/.
export default [
  // Pages publiques : même en-tête et même pied de page
  layout("routes/public/mise-en-page-publique.tsx", [
    index("routes/public/accueil.tsx"),
    route("faq", "routes/public/faq.tsx"),
    route("inscrire-mon-lieu", "routes/public/inscrire-mon-lieu.tsx"),
    // Fiche publique d'un lieu publié (indexée), avec « Vérifié ✓ » ou « Lieu non vérifié »
    route("lieux/:id", "routes/public/fiche-lieu.tsx"),
  ]),
  // Pages légales : cadre simple, servi aussi derrière la page « Bientôt » de sosmiam.fr
  layout("routes/public/mise-en-page-legale.tsx", [
    route("mentions-legales", "routes/public/mentions-legales.tsx"),
    route("confidentialite", "routes/public/confidentialite.tsx"),
    route("cookies", "routes/public/cookies.tsx"),
    route("cgu", "routes/public/cgu.tsx"),
    route("age", "routes/public/age.tsx"),
    route("accessibilite", "routes/public/accessibilite.tsx"),
    route("statistiques", "routes/public/statistiques.tsx"),
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
    route("espace/missions", "routes/ambassadeur/missions.tsx"),
    route("espace/messages", "routes/ambassadeur/messages.tsx"),
  ]),
  // Espace pro (https://pro.sosmiam.fr) : les lieux gèrent leur fiche, leur équipe et leur affichette de table
  layout("routes/pro/mise-en-page-pro.tsx", [
    route("bienvenue", "routes/pro/bienvenue.tsx"),
    route("tableau", "routes/pro/tableau.tsx"),
    route("rattacher", "routes/pro/rattacher.tsx"),
    route("lieu/:id", "routes/pro/ma-fiche.tsx"),
    route("lieu/:id/suggestions", "routes/pro/suggestions.tsx"),
    route("lieu/:id/equipe", "routes/pro/equipe.tsx"),
    route("lieu/:id/affichette", "routes/pro/affichette.tsx"),
  ]),
  // Déconnexion : une page à part entière (formulaire POST vérifié par React Router, l'adresse seule redirige vers /espace),
  // et les fichiers du kit média, réservés aux ambassadeurs validés
  route("deconnexion", "routes/compte/deconnexion.tsx"),
  route("kit-media/:fichier", "routes/ressources/telecharger-kit.ts"),
  // Fichiers du kit média pro, réservés aux ambassadeurs certifiés
  route("kit-media-pro/:fichier", "routes/ressources/telecharger-kit-pro.ts"),
  // Carte de fondateur numérique (SVG), réservée à son fondateur
  route("espace/fondateur/carte.svg", "routes/ressources/carte-fondateur.tsx"),
  // Visuels du kit média à leur taille exacte, pour les capturer (serveur de développement seulement)
  route("rendu-kit/:visuel", "routes/ressources/rendu-kit.tsx"),
  // Affiche et flyer du kit média pro à leur taille exacte, en PNG et en PDF (serveur de développement seulement)
  route("rendu-kit-pro/:visuel", "routes/ressources/rendu-kit-pro.tsx"),
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
  // Toute autre adresse : « Page introuvable » (404). Sans cette route, une adresse inconnue ne passe par aucun
  // middleware de root.tsx (ni le partage des hôtes, ni les statistiques) : React Router répond 404 avant eux.
  // Elle reste la DERNIÈRE de la liste (tests/route-introuvable.test.ts).
  route("*", "routes/public/introuvable.tsx"),
] satisfies RouteConfig;
