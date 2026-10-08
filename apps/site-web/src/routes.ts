import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

// Liste des adresses du site. Chaque page a son fichier dans src/routes/<espace>/.
export default [
  // Pages publiques : même en-tête et même pied de page
  layout("routes/public/mise-en-page-publique.tsx", [
    index("routes/public/accueil.tsx"),
    route("faq", "routes/public/faq.tsx"),
    route("inscrire-mon-lieu", "routes/public/inscrire-mon-lieu.tsx"),
  ]),
  // Pages légales : cadre simple, servi aussi derrière la page « Bientôt » de sosmiam.fr
  layout("routes/public/mise-en-page-legale.tsx", [
    route("mentions-legales", "routes/public/mentions-legales.tsx"),
    route("confidentialite", "routes/public/confidentialite.tsx"),
    route("cookies", "routes/public/cookies.tsx"),
    route("cgu", "routes/public/cgu.tsx"),
    route("age", "routes/public/age.tsx"),
    route("statistiques", "routes/public/statistiques.tsx"),
  ]),
  // Mini-site des liens (bio TikTok et Instagram) : son propre cadre, servi aussi derrière la page « Bientôt »
  route("liens", "routes/public/liens.tsx"),
  // Adresses sans page, appelées par le navigateur (réponses JSON)
  route("localiser", "routes/ressources/localiser.ts"),
] satisfies RouteConfig;
