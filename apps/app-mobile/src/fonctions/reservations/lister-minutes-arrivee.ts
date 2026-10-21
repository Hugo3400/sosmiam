import { lireMinutesHeure } from "@sos-miam/commun/fonctions/temps/lire-minutes-heure";
import { FIN_SERVICE_MAX_MIN } from "@sos-miam/commun/regles/reglages-reservations";
import type { PasCreneaux } from "@sos-miam/commun/types/reglages-reservations";

const QUARTS = [0, 15, 30, 45];

export function listerMinutesArrivee(heure: number, apres: { premier: string; pas: PasCreneaux } | null): number[] {
  if (apres === null) return QUARTS;
  const debut = lireMinutesHeure(apres.premier);
  if (debut === null) return QUARTS;
  return QUARTS.filter((minute) => {
    const instant = heure * 60 + minute;
    return instant >= debut && (instant - debut) % apres.pas === 0 && instant + apres.pas <= FIN_SERVICE_MAX_MIN;
  });
}
