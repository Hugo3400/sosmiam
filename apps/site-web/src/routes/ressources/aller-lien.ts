import { redirect } from "react-router";

import type { Route } from "./+types/aller-lien";
import { liensPublics } from "~/contenus/liens-publics";
import { signalerClic } from "~/services/mesure.server";

/** /liens/aller/:reseau : compte le clic sur un bouton de la page /liens, puis redirige vers le réseau (ou /liens). */
export function loader({ request, params }: Route.LoaderArgs) {
  const lien = liensPublics.find((l) => l.reseau === params.reseau);
  if (!lien) return redirect("/liens");
  signalerClic(request, lien.reseau);
  return redirect(lien.adresse, { headers: { "Cache-Control": "no-store" } });
}
