import { Outlet } from "react-router";

import type { Route } from "./+types/mise-en-page-compte";
import { CadreAmbassadeur } from "~/composants/ambassadeur/CadreAmbassadeur";
import { CadrePro } from "~/composants/pro/CadrePro";
import { lireEspaceHote } from "~/fonctions/hotes/lire-espace-hote";
import { lireCompteConnecte } from "~/services/session-compte.server";

/** Pages propres à chaque personne : jamais gardées par un cache (Cloudflare, navigateur), redirections comprises. */
export const middleware: Route.MiddlewareFunction[] = [
  async (_, suite) => {
    const reponse = await suite();
    if (reponse instanceof Response) reponse.headers.set("Cache-Control", "private, no-store");
    return reponse;
  },
];

/** L'espace qui sert la page (d'après l'hôte) et, pour l'en-tête, si la personne est connectée. */
export async function loader({ request }: Route.LoaderArgs) {
  return { espace: lireEspaceHote(new URL(request.url).host), connecte: (await lireCompteConnecte(request)) !== null };
}

/**
 * Cadre des pages du compte (/connexion, /inscription, /mot-de-passe-oublie, /nouveau-mot-de-passe, /verifier-email) :
 * un seul compte SOS Miam, mais chaque espace garde son habit. Sur pro.sosmiam.fr, celui de l'espace pro ; ailleurs,
 * celui de l'espace ambassadeur.
 */
export default function MiseEnPageCompte({ loaderData }: Route.ComponentProps) {
  if (loaderData.espace === "pro") return <CadrePro connecte={loaderData.connecte}><Outlet /></CadrePro>;
  return <CadreAmbassadeur connecte={loaderData.connecte}><Outlet /></CadreAmbassadeur>;
}
