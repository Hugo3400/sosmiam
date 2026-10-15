import { calculerRappelVeille } from "@sos-miam/commun/fonctions/sorties-miamis/calculer-rappel-veille";
import { ecrireHeure } from "~/fonctions/dates/ecrire-heure";
import { ecrireJourLong } from "~/fonctions/dates/ecrire-jour-long";

export function ecrireRappelVeille(quand: string, maintenant: Date = new Date()): { jour: string; heure: string } | null {
  const rappel = calculerRappelVeille(Date.parse(quand));
  if (Number.isNaN(rappel) || rappel <= maintenant.getTime()) return null;
  const jour = ecrireJourLong(new Date(rappel), maintenant);
  return { jour: jour.charAt(0).toLowerCase() + jour.slice(1), heure: ecrireHeure(new Date(rappel)) };
}
