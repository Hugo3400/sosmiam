import type { Route } from "./+types/robots";

import { site } from "~/contenus/legal/informations-legales";

/**
 * GET /robots.txt : ce que les moteurs de recherche peuvent parcourir. Seul le vrai site est ouvert, avec son plan ;
 * l'aperçu (apercu.sosmiam.fr) et le serveur de développement restent fermés. Cloudflare ajoute devant ses propres
 * lignes de commentaires sur les usages par l'IA.
 */
export function loader({ request }: Route.LoaderArgs) {
  const ouvert = new URL(request.url).hostname === site.adresse;
  const lignes = ouvert
    ? ["User-agent: *", "Allow: /", "Disallow: /localiser", "Disallow: /liens/aller/", "", `Sitemap: https://${site.adresse}/sitemap.xml`]
    : ["User-agent: *", "Disallow: /"];
  return new Response(`${lignes.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
