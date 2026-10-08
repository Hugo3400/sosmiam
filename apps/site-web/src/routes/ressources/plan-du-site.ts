import type { Route } from "./+types/plan-du-site";

import { site } from "~/contenus/legal/informations-legales";
import { pagesIndexees } from "~/contenus/plan-du-site";
import { HOTE_AMBASSADEUR } from "~/fonctions/hotes/choisir-redirection-hote";

/**
 * GET /sitemap.xml : la liste des pages publiques, pour les moteurs de recherche (contenu dans src/contenus/plan-du-site.ts).
 * Sur l'espace ambassadeur, une seule page publique : le programme.
 */
export function loader({ request }: Route.LoaderArgs) {
  const espaceAmbassadeur = new URL(request.url).hostname === HOTE_AMBASSADEUR;
  const pages = espaceAmbassadeur ? [`https://${HOTE_AMBASSADEUR}/programme`] : pagesIndexees.map((chemin) => `https://${site.adresse}${chemin}`);
  const adresses = pages.map((adresse) => `  <url><loc>${adresse}</loc></url>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${adresses}\n</urlset>\n`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
