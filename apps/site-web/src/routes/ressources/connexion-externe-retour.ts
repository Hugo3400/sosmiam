import { data, redirect } from "react-router";

import type { Route } from "./+types/connexion-externe-retour";
import { connecterAvecFournisseur } from "~/services/comptes.server";
import { estFournisseur, terminerConnexionExterne } from "~/services/connexion-externe.server";
import { poserCookieSession } from "~/services/session-compte.server";

/**
 * POST /connexion/apple/retour et /connexion/google/retour : la réponse d'Apple ou de Google (form_post), envoyée par
 * LEUR site. Route sans page : la vérification d'origine des formulaires de React Router ne s'y applique pas (elle
 * refuserait ce POST venu d'ailleurs) ; la protection, c'est le state, vérifié contre le cookie de départ.
 */
export async function action({ request, params }: Route.ActionArgs) {
  if (!estFournisseur(params.fournisseur)) throw data("Introuvable", { status: 404 });
  return terminerConnexionExterne(request, params.fournisseur, { appeler: connecterAvecFournisseur, poserSession: poserCookieSession });
}

/** Adresse ouverte à la main : rien à faire ici */
export function loader({ params }: Route.LoaderArgs) {
  if (!estFournisseur(params.fournisseur)) throw data("Introuvable", { status: 404 });
  throw redirect("/mon-compte");
}
