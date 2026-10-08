import { Outlet } from "react-router";

import type { Route } from "./+types/mise-en-page-ambassadeur";
import { EnTeteAmbassadeur } from "~/composants/ambassadeur/EnTeteAmbassadeur";
import { PiedDePageAmbassadeur } from "~/composants/ambassadeur/PiedDePageAmbassadeur";
import { LienCanonique } from "~/composants/mise-en-page/LienCanonique";
import { LienEvitement } from "~/composants/mise-en-page/LienEvitement";
import { HOTE_AMBASSADEUR } from "~/fonctions/hotes/choisir-redirection-hote";
import { lireCompteConnecte } from "~/services/session-compte.server";

/** Pages propres à chaque personne (connectée ou non) : jamais gardées par un cache, ni par Cloudflare ni par le navigateur. */
export function headers(_: Route.HeadersArgs) {
  return { "Cache-Control": "private, no-store" };
}

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
      <PiedDePageAmbassadeur />
    </div>
  );
}
