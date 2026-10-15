import type { CreneauOuverture } from "../../types/lieu.ts";
import type { ReglagesServicesReservations, ServiceReservation } from "../../types/reglages-reservations.ts";
import { ecrireHeureMinutes } from "../temps/ecrire-heure-minutes.ts";
import { existeHeureParis } from "../temps/existe-heure-paris.ts";
import { lireJourSemaine } from "../temps/lire-jour-semaine.ts";
import { listerMinutesOuverture } from "./lister-minutes-ouverture.ts";
import { listerMinutesServices } from "./lister-minutes-services.ts";

export type CreneauReel = { minute: number; heure: string; service: ServiceReservation | null };

export function listerCreneauxReels(
  ouverture: readonly CreneauOuverture[],
  reglages: Pick<ReglagesServicesReservations, "services">,
  jour: string,
): CreneauReel[] {
  const jourSemaine = lireJourSemaine(jour);
  if (jourSemaine === null) return [];
  const minutes =
    reglages.services.length === 0
      ? listerMinutesOuverture(ouverture, jourSemaine).map((minute) => ({ minute, service: null }))
      : listerMinutesServices(reglages.services, jourSemaine);
  return minutes
    .map(({ minute, service }) => ({ minute, heure: ecrireHeureMinutes(minute), service }))
    .filter((creneau) => existeHeureParis(jour, creneau.heure));
}
