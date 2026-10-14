import { redirect } from "react-router";

import type { Route } from "./+types/connexion-qr-depart";
import { demanderConnexionQr, attendreConnexionQr } from "~/services/comptes.server";
import { demarrerConnexionQr } from "~/services/connexion-qr.server";
import { poserCookieSession } from "~/services/session-compte.server";

/**
 * POST /connexion/qr (sur sosmiam.fr, ambassadeur. et pro.) : « Me connecter avec l'app » demande un QR à l'API
 * (services/connexion-qr.server.ts). JSON pour le bloc avec JavaScript, sinon retour à la page avec le QR.
 */
export function action({ request }: Route.ActionArgs) {
  return demarrerConnexionQr(request, { demander: demanderConnexionQr, attendre: attendreConnexionQr, poserSession: poserCookieSession });
}

/** Adresse ouverte à la main : la page de connexion de l'hôte */
export function loader({ request }: Route.LoaderArgs) {
  throw redirect(/^(ambassadeur|pro)\./i.test(new URL(request.url).hostname) ? "/connexion" : "/mon-compte");
}
