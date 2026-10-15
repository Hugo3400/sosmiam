import { calculerDecalageParis } from "../../../../../packages/commun/src/fonctions/temps/calculer-decalage-paris.ts";
import { calculerJourParis } from "../../../../../packages/commun/src/fonctions/temps/calculer-jour-paris.ts";
import { decalerJour } from "../../../../../packages/commun/src/fonctions/temps/decaler-jour.ts";

const HEURE_DU_SOIR = 18;
const jourEnLettres = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long" });

function ecrireJour(creneau: Date): string {
  const morceaux = jourEnLettres.formatToParts(creneau);
  const lire = (type: Intl.DateTimeFormatPartTypes) => morceaux.find((m) => m.type === type)?.value ?? "";
  const quantieme = lire("day");
  return `${lire("weekday")} ${quantieme === "1" ? "1er" : quantieme} ${lire("month")}`;
}

export function ecrireMomentReservation(creneau: Date, maintenant: Date): string {
  const instant = creneau.getTime();
  const aParis = new Date(instant + calculerDecalageParis(instant));
  const heures = aParis.getUTCHours();
  const minutes = aParis.getUTCMinutes();
  const heure = `${heures}h${minutes === 0 ? "" : String(minutes).padStart(2, "0")}`;
  const jour = calculerJourParis(instant);
  const aujourdhui = calculerJourParis(maintenant.getTime());
  if (jour === aujourdhui) return `${heures >= HEURE_DU_SOIR ? "ce soir" : "aujourd'hui"} à ${heure}`;
  if (jour === decalerJour(aujourdhui, 1)) return `demain à ${heure}`;
  return `${ecrireJour(creneau)} à ${heure}`;
}
