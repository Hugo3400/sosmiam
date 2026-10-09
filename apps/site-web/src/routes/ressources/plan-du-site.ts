import type { Route } from "./+types/plan-du-site";

import { site } from "~/contenus/legal/informations-legales";
import { pagesIndexees } from "~/contenus/plan-du-site";
import { HOTE_AMBASSADEUR, HOTE_PRO } from "~/fonctions/hotes/choisir-redirection-hote";

/**
 * GET /sitemap.xml : la liste des pages publiques, pour les moteurs de recherche (contenu dans src/contenus/plan-du-site.ts).
 * Sur l'espace ambassadeur, une seule page publique : le programme ; sur l'espace pro, /bienvenue. Les fiches des lieux
 * (/lieux/:id) n'y sont pas encore : il faudra les lire à l'API (lieux publiés) pour les ajouter.
 */
export function loader({ request }: Route.LoaderArgs) {
  const hote = new URL(request.url).hostname;
  const pages = hote === HOTE_AMBASSADEUR
    ? [`https://${HOTE_AMBASSADEUR}/programme`]
    : hote === HOTE_PRO ? [`https://${HOTE_PRO}/bienvenue`] : pagesIndexees.map((chemin) => `https://${site.adresse}${chemin}`);
  const adresses = pages.map((adresse) => `  <url><loc>${adresse}</loc></url>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${adresses}\n</urlset>\n`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
