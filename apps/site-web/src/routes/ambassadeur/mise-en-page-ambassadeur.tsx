import { Outlet } from "react-router";

import type { Route } from "./+types/mise-en-page-ambassadeur";
import { EnTeteAmbassadeur } from "~/composants/ambassadeur/EnTeteAmbassadeur";
import { LienCanonique } from "~/composants/mise-en-page/LienCanonique";
import { LienEvitement } from "~/composants/mise-en-page/LienEvitement";
import { PiedDePage } from "~/composants/mise-en-page/PiedDePage";
import { HOTE_AMBASSADEUR } from "~/fonctions/hotes/choisir-redirection-hote";
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

/**
 * Cadre de l'espace ambassadeur (https://ambassadeur.sosmiam.fr) : en-tête, contenu, pied de page avec les pages légales
 * de sosmiam.fr. Pas d'ancres sans « # » ici : /nouveau-mot-de-passe lit son jeton après le « # ».
 */
export default function MiseEnPageAmbassadeur({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex min-h-screen flex-col bg-creme">
      <LienCanonique site={`https://${HOTE_AMBASSADEUR}`} />
      <LienEvitement />
      <EnTeteAmbassadeur connecte={loaderData.connecte} />
      <main id="contenu" tabIndex={-1} className="flex-1">
        <Outlet />
      </main>
      <PiedDePage espace="ambassadeur" accroche={"SOS Miam Ambassadeurs : un programme de passionnés, dès 18\u00a0ans."} />
    </div>
  );
}
