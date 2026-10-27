import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { TEXTES_MESSAGES_COMPTE_PAR_LANGUE } from "../../contenus/messages-compte.ts";

export function ecrireAttente(secondes: number | undefined, langue: Langue): string {
  const { attente } = choisirTextes(TEXTES_MESSAGES_COMPTE_PAR_LANGUE, langue);
  if (!secondes || secondes <= 0) return attente.quelquesMinutes;
  const minutes = Math.ceil(secondes / 60);
  if (minutes < 60) return attente.minutes(minutes);
  const reste = minutes % 60;
  const heures = attente.heures(Math.floor(minutes / 60));
  return reste ? attente.heuresEtMinutes(heures, attente.minutes(reste)) : heures;
}
