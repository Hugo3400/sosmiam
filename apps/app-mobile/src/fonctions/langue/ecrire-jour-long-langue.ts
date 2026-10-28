import { CALENDRIER_PAR_LANGUE } from "@sos-miam/commun/contenus/calendrier";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { ecrireJourLong } from "~/fonctions/dates/ecrire-jour-long";

export function ecrireJourLongLangue(instant: Date | string, langue: Langue, maintenant: Date = new Date()): string {
  if (langue !== "en") return ecrireJourLong(instant, maintenant);
  const date = typeof instant === "string" ? new Date(instant) : instant;
  const { jours, mois } = CALENDRIER_PAR_LANGUE.en;
  const annee = date.getFullYear() === maintenant.getFullYear() ? "" : ` ${date.getFullYear()}`;
  return `${jours[date.getDay()]} ${date.getDate()} ${mois[date.getMonth()]}${annee}`;
}
