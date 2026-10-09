import type { Route } from "./+types/robots";

import { site } from "~/contenus/legal/informations-legales";
import { HOTE_AMBASSADEUR, HOTE_PRO } from "~/fonctions/hotes/choisir-redirection-hote";

/**
 * GET /robots.txt : ce que les moteurs de recherche peuvent parcourir. Le vrai site est ouvert (fiches /lieux/ comprises),
 * avec son plan ; fermés : /localiser, /liens/aller/ et les QR de vitrine /l/, qui ne font que rediriger. Sur
 * l'espace ambassadeur, seule la page du programme l'est, avec ce qu'elle charge, la racine qui y renvoie et le plan du
 * site (le reste est réservé aux comptes) ; sur l'espace pro, de même avec la page /bienvenue. L'aperçu (apercu.sosmiam.fr) et le serveur de développement restent fermés.
 * Cloudflare ajoute devant ses propres lignes de commentaires sur les usages par l'IA.
 */
export function loader({ request }: Route.LoaderArgs) {
  const hote = new URL(request.url).hostname;
  let lignes = ["User-agent: *", "Disallow: /"];
  if (hote === site.adresse) {
    lignes = ["User-agent: *", "Allow: /", "Disallow: /localiser", "Disallow: /liens/aller/", "Disallow: /l/", "", `Sitemap: https://${site.adresse}/sitemap.xml`];
  } else if (hote === HOTE_AMBASSADEUR) {
    // Google doit pouvoir lire ce que /programme charge (styles, scripts, polices, icônes), la racine (elle renvoie vers
    // /programme ; Google y cherche l'icône du site) et le plan du site déclaré plus bas. « /$ » : la racine exacte seule.
    lignes = [
      "User-agent: *",
      "Allow: /programme",
      "Allow: /sitemap.xml",
      "Allow: /assets/",
      "Allow: /icones/",
      "Allow: /favicon.ico",
      "Allow: /$",
      "Disallow: /",
      "",
      `Sitemap: https://${HOTE_AMBASSADEUR}/sitemap.xml`,
    ];
  } else if (hote === HOTE_PRO) {
    // Même principe : seule /bienvenue (vers laquelle mène la racine) est ouverte, avec ce qu'elle charge
    lignes = [
      "User-agent: *",
      "Allow: /bienvenue",
      "Allow: /sitemap.xml",
      "Allow: /assets/",
      "Allow: /icones/",
      "Allow: /favicon.ico",
      "Allow: /$",
      "Disallow: /",
      "",
      `Sitemap: https://${HOTE_PRO}/sitemap.xml`,
    ];
  }
  return new Response(`${lignes.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
