import { JOURS_RESERVATION_MAX } from "../../regles/reservations.ts";
import { PEU_DE_PLACES_MIN, PEU_DE_PLACES_PART, REGLAGES_RESERVATIONS_DEFAUT } from "../../regles/reglages-reservations.ts";
import type { CreneauOuverture } from "../../types/lieu.ts";
import type { CreneauDisponible, OccupationReservation, ReglagesReservations } from "../../types/reglages-reservations.ts";
import { calculerEcartJoursParis } from "../temps/calculer-ecart-jours-paris.ts";
import { calculerPlacesRestantes } from "./calculer-places-restantes.ts";
import { listerCreneauxReels } from "./lister-creneaux-reels.ts";
import { preparerOccupationJour } from "./preparer-occupation-jour.ts";
import { verifierDelaiReservation } from "./verifier-delai-reservation.ts";

export type DemandeCreneaux = {
  ouverture: readonly CreneauOuverture[];
  reglages: ReglagesReservations | null;
  jour: string;
  maintenant: Date;
  occupees?: readonly OccupationReservation[];
  personnes?: number;
};

export function listerCreneauxDisponibles(d: DemandeCreneaux): CreneauDisponible[] {
  const maintenantMs = d.maintenant.getTime();
  const ecart = calculerEcartJoursParis(d.jour, maintenantMs);
  if (ecart === null || ecart < 0 || ecart > JOURS_RESERVATION_MAX) return [];
  const reglages = d.reglages ?? REGLAGES_RESERVATIONS_DEFAUT;
  if (reglages.joursFermes.includes(d.jour)) return [];
  const personnes = d.personnes ?? 1;
  const occupation = preparerOccupationJour(reglages.services, d.jour, d.occupees ?? []);
  return listerCreneauxReels(d.ouverture, reglages, d.jour).flatMap(({ minute, heure, service }): CreneauDisponible[] => {
    if (!verifierDelaiReservation(reglages.delai, d.jour, heure, maintenantMs)) return [];
    if (service === null) return [{ heure, peuDePlaces: false }];
    const restantes = calculerPlacesRestantes({ services: reglages.services, service, jour: d.jour, minute }, occupation);
    if (restantes < personnes) return [];
    const seuil = Math.max(PEU_DE_PLACES_MIN, Math.ceil(service.couvertsParCreneau * PEU_DE_PLACES_PART));
    return [{ heure, peuDePlaces: restantes <= seuil }];
  });
}
