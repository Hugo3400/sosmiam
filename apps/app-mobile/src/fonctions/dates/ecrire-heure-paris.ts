import { calculerDecalageParis } from "@sos-miam/commun/fonctions/temps/calculer-decalage-paris";

import { formaterHeure } from "~/fonctions/dates/formater-heure";

const deuxChiffres = (n: number) => String(n).padStart(2, "0");

export function ecrireHeureParis(instant: Date | string): string {
  const ms = typeof instant === "string" ? Date.parse(instant) : instant.getTime();
  if (Number.isNaN(ms)) return "";
  const aParis = new Date(ms + calculerDecalageParis(ms));
  return formaterHeure(`${deuxChiffres(aParis.getUTCHours())}:${deuxChiffres(aParis.getUTCMinutes())}`);
}
