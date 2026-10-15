import { PAS_CRENEAUX_MIN } from "../../regles/reservations.ts";
import type { CreneauOuverture } from "../../types/lieu.ts";
import { lireMinutesHeure } from "../temps/lire-minutes-heure.ts";

const MINUIT = 24 * 60;

export function listerMinutesOuverture(ouverture: readonly CreneauOuverture[], jourSemaine: number): number[] {
  const minutes = new Set<number>();
  for (const creneau of ouverture) {
    if (!creneau.jours.includes(jourSemaine)) continue;
    const debut = lireMinutesHeure(creneau.de);
    const fin = lireMinutesHeure(creneau.a);
    if (debut === null || fin === null || debut >= MINUIT) continue;
    const finCeJour = fin > debut ? Math.min(fin, MINUIT) : MINUIT;
    for (let t = Math.ceil(debut / PAS_CRENEAUX_MIN) * PAS_CRENEAUX_MIN; t < finCeJour; t += PAS_CRENEAUX_MIN) minutes.add(t);
  }
  return [...minutes].sort((a, b) => a - b);
}
