import { redirect } from "react-router";

import type { Route } from "./+types/aller-lien";
import { liensPublics } from "~/contenus/liens-publics";
import { ecrireAdresseLangue } from "~/fonctions/langue/ecrire-adresse-langue";
import { lireLangueRequete } from "~/services/langue.server";
import { signalerClic } from "~/services/mesure.server";

/** /liens/aller/:reseau : compte le clic sur un bouton de la page /liens, puis redirige vers le réseau (ou /liens). */
export function loader({ request, params }: Route.LoaderArgs) {
  const lien = liensPublics.find((l) => l.reseau === params.reseau);
  if (!lien) return redirect("/liens");
  signalerClic(request, lien.reseau);
  return redirect(ecrireAdresseLangue(lien.adresse, lireLangueRequete(request).langue), { headers: { "Cache-Control": "no-store" } });
}
