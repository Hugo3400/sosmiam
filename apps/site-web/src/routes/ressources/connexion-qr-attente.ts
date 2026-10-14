import type { Route } from "./+types/connexion-qr-attente";
import { attendreConnexionQr, demanderConnexionQr } from "~/services/comptes.server";
import { suivreConnexionQr } from "~/services/connexion-qr.server";
import { poserCookieSession } from "~/services/session-compte.server";

const dependances = { demander: demanderConnexionQr, attendre: attendreConnexionQr, poserSession: poserCookieSession };

/** POST /connexion/qr/attente : le bloc interroge toutes les 2 s (JSON) ; services/connexion-qr.server.ts */
export function action({ request }: Route.ActionArgs) {
  return suivreConnexionQr(request, dependances);
}

/** GET /connexion/qr/attente : « J'ai validé sur mon téléphone », sans JavaScript (redirige vers la suite) */
export function loader({ request }: Route.LoaderArgs) {
  return suivreConnexionQr(request, dependances);
}
