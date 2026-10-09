import { renderToStaticMarkup } from "react-dom/server";

import type { Route } from "./+types/carte-fondateur";
import { CarteFondateur } from "~/composants/fondateurs/CarteFondateur";
import { ecrireNumeroFondateur } from "~/fonctions/fondateurs/ecrire-numero-fondateur";
import { lireCandidature } from "~/services/comptes.server";
import { exigerAmbassadeurActif, lireIpVisiteur, redirigerSiSessionFermee } from "~/services/session-compte.server";
// La police des titres, glissée dans le fichier (adresse data:) : la carte garde son allure ouverte seule ou en image
import policeLatin from "@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2?inline";
import policeLatinEtendu from "@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-ext-wght-normal.woff2?inline";

// Mêmes plages que @fontsource-variable/bricolage-grotesque (wght.css)
const POLICES = [
  {
    url: policeLatin,
    plage: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
  },
  {
    url: policeLatinEtendu,
    plage: "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
  },
];

const enTetesPrives = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const annee = new Intl.DateTimeFormat("fr-FR", { year: "numeric", timeZone: "Europe/Paris" });

/**
 * GET /espace/fondateur/carte.svg : la carte de fondateur numérique de la personne connectée (candidature acceptée, ou
 * gardée en souvenir après un déménagement), en SVG. ?titre=fondatrice écrit « Fondatrice » (rien n'est gardé) ;
 * ?apercu=1 l'affiche dans la page au lieu de la télécharger. Jamais gardée en cache : elle porte un prénom.
 */
export async function loader({ request }: Route.LoaderArgs) {
  let connecte: Awaited<ReturnType<typeof exigerAmbassadeurActif>>;
  try {
    connecte = await exigerAmbassadeurActif(request);
  } catch (redirection) {
    // L'adresse finit par .svg : un relais (Cloudflare) pourrait garder la redirection d'un visiteur pour les suivants
    if (redirection instanceof Response) redirection.headers.set("Cache-Control", "private, no-store");
    throw redirection;
  }
  const reponse = await lireCandidature(connecte.jeton, lireIpVisiteur(request));
  if (!reponse.ok) {
    await redirigerSiSessionFermee(request, reponse.erreur);
    return new Response("Ta carte n'a pas pu être préparée : réessaie dans un instant.", { status: 503, headers: { ...enTetesPrives, "Content-Type": "text/plain; charset=utf-8" } });
  }
  const { candidature } = reponse;
  if (!candidature || (candidature.statut !== "acceptee" && candidature.statut !== "souvenir") || !candidature.numeroLocal) {
    return new Response("Pas de carte de fondateur pour ce compte.", { status: 404, headers: { ...enTetesPrives, "Content-Type": "text/plain; charset=utf-8" } });
  }

  const parametres = new URL(request.url).searchParams;
  const titre = parametres.get("titre") === "fondatrice" ? "Fondatrice" : "Fondateur";
  const date = new Date(candidature.reponduLe ?? Date.now());
  const svg = renderToStaticMarkup(
    <CarteFondateur
      prenom={connecte.compte.prenom}
      titre={titre}
      numero={ecrireNumeroFondateur(candidature, titre)}
      annee={Number(annee.format(Number.isNaN(date.getTime()) ? new Date() : date))}
      polices={POLICES}
    />,
  );
  const nomFichier = `carte-${titre.toLowerCase()}-sos-miam.svg`;
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n${svg}\n`, {
    headers: {
      ...enTetesPrives,
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Disposition": `${parametres.get("apercu") === "1" ? "inline" : "attachment"}; filename="${nomFichier}"`,
      // Un SVG ouvert seul ne peut rien charger ni lancer (ses polices sont dedans)
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; font-src data:; sandbox",
    },
  });
}
