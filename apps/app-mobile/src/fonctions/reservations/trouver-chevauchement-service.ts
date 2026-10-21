import { lireMinutesHeure } from "@sos-miam/commun/fonctions/temps/lire-minutes-heure";
import type { ServiceReservation } from "@sos-miam/commun/types/reglages-reservations";

const ORDRE_SEMAINE = [1, 2, 3, 4, 5, 6, 0];

const lirePlage = (service: ServiceReservation) => {
  const debut = lireMinutesHeure(service.premier);
  const dernier = lireMinutesHeure(service.dernier);
  return debut === null || dernier === null ? null : { debut, fin: dernier + service.pas };
};

export function trouverChevauchementService(candidat: ServiceReservation, autres: readonly ServiceReservation[]): { autre: ServiceReservation; jour: number } | null {
  const plage = lirePlage(candidat);
  if (!plage) return null;
  for (const autre of autres) {
    const sienne = lirePlage(autre);
    if (!sienne || !(plage.debut < sienne.fin && sienne.debut < plage.fin)) continue;
    const jour = ORDRE_SEMAINE.find((j) => candidat.jours.includes(j) && autre.jours.includes(j));
    if (jour !== undefined) return { autre, jour };
  }
  return null;
}
