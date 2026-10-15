import { ecrireHeure } from "~/fonctions/dates/ecrire-heure";
import { ecrireJourLong } from "~/fonctions/dates/ecrire-jour-long";

export function ecrireQuandLong(iso: string, maintenant: Date = new Date()): string {
  return `${ecrireJourLong(iso, maintenant)} · ${ecrireHeure(iso)}`;
}
