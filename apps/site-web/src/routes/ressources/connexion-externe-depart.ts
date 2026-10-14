import { data } from "react-router";

import type { Route } from "./+types/connexion-externe-depart";
import { demarrerConnexionExterne, estFournisseur } from "~/services/connexion-externe.server";

/**
 * GET /connexion/apple et /connexion/google (sur sosmiam.fr, ambassadeur. et pro.) : le départ vers Apple ou Google
 * (services/connexion-externe.server.ts). Paramètres : depart (la page des boutons), retour (chemin à rouvrir), intention.
 */
export function loader({ request, params }: Route.LoaderArgs) {
  if (!estFournisseur(params.fournisseur)) throw data("Introuvable", { status: 404 });
  return demarrerConnexionExterne(request, params.fournisseur);
}
