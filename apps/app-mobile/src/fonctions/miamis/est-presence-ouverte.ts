import { PRESENCE_OUVERTE_MINUTES_APRES, PRESENCE_OUVERTE_MINUTES_AVANT } from "@sos-miam/commun/regles/sorties-miamis";

export function estPresenceOuverte(quand: string, maintenant: Date = new Date()): boolean {
  const ecartMinutes = (maintenant.getTime() - Date.parse(quand)) / 60_000;
  return ecartMinutes >= -PRESENCE_OUVERTE_MINUTES_AVANT && ecartMinutes <= PRESENCE_OUVERTE_MINUTES_APRES;
}
