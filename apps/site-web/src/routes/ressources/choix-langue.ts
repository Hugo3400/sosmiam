import { redirect } from "react-router";

import type { Route } from "./+types/choix-langue";
import { lireLangue } from "../../../../../packages/commun/src/fonctions/langue/lire-langue.ts";
import { ecrireCheminLangue } from "~/fonctions/langue/ecrire-chemin-langue";
import { ecrireCookieLangue } from "~/fonctions/langue/ecrire-cookie-langue";
import { lireLangueRequete } from "~/services/langue.server";

export function loader(_: Route.LoaderArgs) {
  return redirect("/");
}

export async function action({ request }: Route.ActionArgs) {
  const formulaire = await request.formData().catch(() => null);
  const langue = lireLangue(formulaire?.get("langue"));
  const brut = formulaire?.get("retour");
  const retour = typeof brut === "string" && /^\/(?![/\\])[^\\\s]*$/.test(brut) && brut.length <= 2000 ? brut : "/";
  const { servies } = lireLangueRequete(request);
  if (!langue || !servies.includes(langue) || servies.length < 2) return redirect(retour, 303);
  return redirect(ecrireCheminLangue(retour, langue), { status: 303, headers: { "Set-Cookie": ecrireCookieLangue(langue, new URL(request.url).host) } });
}
