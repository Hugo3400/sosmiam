import { calculerDecalageParis } from "../../../../../packages/commun/src/fonctions/temps/calculer-decalage-paris.ts";

export function ecrireHeureReservation(creneau: Date): string {
  const instant = creneau.getTime();
  const aParis = new Date(instant + calculerDecalageParis(instant));
  const minutes = aParis.getUTCMinutes();
  return `${aParis.getUTCHours()}h${minutes === 0 ? "" : String(minutes).padStart(2, "0")}`;
}
