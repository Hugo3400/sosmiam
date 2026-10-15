import { JOURS_FERMES_MAX } from "../../regles/reglages-reservations.ts";
import { validerJourFermeReservation } from "../../validation/valider-jour-ferme-reservation.ts";

export function nettoyerJoursFermes(brut: unknown, maintenant: Date): string[] {
  if (!Array.isArray(brut)) return [];
  const jours = new Set<string>();
  for (const jour of brut) {
    const valide = validerJourFermeReservation(jour, maintenant);
    if (valide !== null) jours.add(valide);
  }
  return [...jours].sort().slice(0, JOURS_FERMES_MAX);
}
