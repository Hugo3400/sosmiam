import { PRESENCE_OUVERTE_MINUTES_APRES, PRESENCE_OUVERTE_MINUTES_AVANT } from "../../../../../packages/commun/src/regles/sorties-miamis.ts";

export function calculerFenetrePresence(quand: Date): { de: Date; a: Date } {
  return {
    de: new Date(quand.getTime() - PRESENCE_OUVERTE_MINUTES_AVANT * 60_000),
    a: new Date(quand.getTime() + PRESENCE_OUVERTE_MINUTES_APRES * 60_000),
  };
}
