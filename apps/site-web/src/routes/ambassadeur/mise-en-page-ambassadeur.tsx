import { Outlet } from "react-router";

import type { Route } from "./+types/mise-en-page-ambassadeur";
import { CadreAmbassadeur } from "~/composants/ambassadeur/CadreAmbassadeur";
import { lireCompteConnecte } from "~/services/session-compte.server";

/**
 * Pages propres à chaque personne (connectée ou non) : jamais gardées par un cache, ni par Cloudflare ni par le navigateur.
 * Posé sur toutes les réponses du cadre, redirections comprises (« /espace » sans session renvoie à /connexion).
 */
export const middleware: Route.MiddlewareFunction[] = [
  async (_, suite) => {
    const reponse = await suite();
    if (reponse instanceof Response) reponse.headers.set("Cache-Control", "private, no-store");
    return reponse;
  },
];

/** Pour l'en-tête : la personne est-elle connectée ? (Rien d'autre ne part vers le navigateur.) */
export async function loader({ request }: Route.LoaderArgs) {
  return { connecte: (await lireCompteConnecte(request)) !== null };
}

/** Cadre de l'espace ambassadeur (https://ambassadeur.sosmiam.fr) : voir composants/ambassadeur/CadreAmbassadeur.tsx. */
export default function MiseEnPageAmbassadeur({ loaderData }: Route.ComponentProps) {
  return (
    <CadreAmbassadeur connecte={loaderData.connecte}>
      <Outlet />
    </CadreAmbassadeur>
  );
}
