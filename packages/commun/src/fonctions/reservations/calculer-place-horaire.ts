import type { OccupationReservation, PlaceHoraireReservation, ReglagesReservations } from "../../types/reglages-reservations.ts";
import { calculerJourParis } from "../temps/calculer-jour-paris.ts";
import { lireHeureParis } from "../temps/lire-heure-paris.ts";
import { lireJourSemaine } from "../temps/lire-jour-semaine.ts";
import { lireMinutesHeure } from "../temps/lire-minutes-heure.ts";
import { calculerPlacesRestantes } from "./calculer-places-restantes.ts";
import { compterCouvertsService } from "./compter-couverts-service.ts";
import { rattacherServiceReservation } from "./rattacher-service-reservation.ts";
import { trouverServiceReservation } from "./trouver-service-reservation.ts";

export function calculerPlaceHoraire(
  reglages: ReglagesReservations | null,
  occupees: readonly OccupationReservation[],
  creneau: string,
): PlaceHoraireReservation {
  const instant = Date.parse(creneau);
  if (Number.isNaN(instant)) return { places: null, horsReglages: true, jourFerme: false };
  const jour = calculerJourParis(instant);
  const jourFerme = reglages?.joursFermes.includes(jour) ?? false;
  const services = reglages?.services ?? [];
  if (services.length === 0) return { places: null, horsReglages: false, jourFerme };
  const jourSemaine = lireJourSemaine(jour);
  const minute = lireMinutesHeure(lireHeureParis(instant));
  if (jourSemaine === null || minute === null) return { places: null, horsReglages: true, jourFerme };
  const trouve = trouverServiceReservation(services, jourSemaine, minute);
  if (trouve) {
    return { places: calculerPlacesRestantes({ services, service: trouve.service, jour, minute: trouve.minute }, occupees), horsReglages: false, jourFerme };
  }
  const proche = rattacherServiceReservation(services, jourSemaine, minute);
  const places = proche ? proche.couvertsParService - compterCouvertsService(services, proche, jour, occupees) : null;
  return { places, horsReglages: true, jourFerme };
}
