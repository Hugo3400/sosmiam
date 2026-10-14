import { redirect } from "react-router";

import type { Route } from "./+types/choix-cookies";
import { ADRESSE_REGLAGES_COOKIES } from "~/contenus/cookies-consentement";
import { enregistrerChoixConsentement } from "~/services/consentement.server";

/** Ouverte directement : la page des réglages. */
export function loader(_: Route.LoaderArgs) {
  return redirect(ADRESSE_REGLAGES_COOKIES);
}

/** POST /cookies/choix (bandeau, panneau, /cookies#mes-choix, vignettes) : enregistre le choix, avec ou sans JavaScript. */
export function action({ request }: Route.ActionArgs) {
  return enregistrerChoixConsentement(request);
}
