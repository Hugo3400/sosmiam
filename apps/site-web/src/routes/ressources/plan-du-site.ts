import { site } from "~/contenus/legal/informations-legales";
import { pagesIndexees } from "~/contenus/plan-du-site";

/** GET /sitemap.xml : la liste des pages publiques, pour les moteurs de recherche (contenu dans src/contenus/plan-du-site.ts). */
export function loader() {
  const adresses = pagesIndexees.map((chemin) => `  <url><loc>https://${site.adresse}${chemin}</loc></url>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${adresses}\n</urlset>\n`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
