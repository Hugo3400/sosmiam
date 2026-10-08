import type { Route } from "./+types/robots";

import { site } from "~/contenus/legal/informations-legales";
import { HOTE_AMBASSADEUR } from "~/fonctions/hotes/choisir-redirection-hote";

/**
 * GET /robots.txt : ce que les moteurs de recherche peuvent parcourir. Le vrai site est ouvert, avec son plan ; sur
 * l'espace ambassadeur, seule la page du programme l'est (le reste est réservé aux comptes). L'aperçu (apercu.sosmiam.fr)
 * et le serveur de développement restent fermés. Cloudflare ajoute devant ses propres lignes de commentaires sur les
 * usages par l'IA.
 */
export function loader({ request }: Route.LoaderArgs) {
  const hote = new URL(request.url).hostname;
  let lignes = ["User-agent: *", "Disallow: /"];
  if (hote === site.adresse) {
    lignes = ["User-agent: *", "Allow: /", "Disallow: /localiser", "Disallow: /liens/aller/", "", `Sitemap: https://${site.adresse}/sitemap.xml`];
  } else if (hote === HOTE_AMBASSADEUR) {
    lignes = ["User-agent: *", "Allow: /programme", "Disallow: /", "", `Sitemap: https://${HOTE_AMBASSADEUR}/sitemap.xml`];
  }
  return new Response(`${lignes.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
