import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { TEXTES_NOTIFICATIONS_PAR_LANGUE } from "~/contenus/textes-notifications";
import type { ResultatEffacementCloche } from "~/hooks/utiliser-notifications";

export function decrireEffacementCloche(resultat: ResultatEffacementCloche, portee: "une" | "lues", langue: Langue): string {
  const T = choisirTextes(TEXTES_NOTIFICATIONS_PAR_LANGUE, langue).effacement;
  if (resultat.ok) {
    if (portee === "une") return T.une;
    const n = resultat.effacees;
    if (n === 0) return T.rienABalayer;
    return T.balayees(n);
  }
  if (resultat.erreur === "hors-ligne") {
    return portee === "une" ? T.horsLigneUne : T.horsLigneLues;
  }
  if (resultat.erreur === "trop-de-demandes") return T.tropDeDemandes;
  return portee === "une" ? T.erreurUne : T.erreurLues;
}
