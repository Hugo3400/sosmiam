import { JOURS_RESERVATION_MAX } from "../../regles/reservations.ts";
import { REGLAGES_RESERVATIONS_DEFAUT } from "../../regles/reglages-reservations.ts";
import type { CreneauOuverture } from "../../types/lieu.ts";
import type { EtatJourReservation, JourReservation, OccupationReservation, ReglagesReservations } from "../../types/reglages-reservations.ts";
import { calculerJourParis } from "../temps/calculer-jour-paris.ts";
import { decalerJour } from "../temps/decaler-jour.ts";
import { lireJourSemaine } from "../temps/lire-jour-semaine.ts";
import { calculerPlacesRestantes } from "./calculer-places-restantes.ts";
import { listerCreneauxReels } from "./lister-creneaux-reels.ts";
import type { CreneauReel } from "./lister-creneaux-reels.ts";
import { listerMinutesOuverture } from "./lister-minutes-ouverture.ts";
import { preparerOccupationJour } from "./preparer-occupation-jour.ts";
import { verifierDelaiReservation } from "./verifier-delai-reservation.ts";

export type DemandeJoursReservation = {
  ouverture: readonly CreneauOuverture[];
  reglages: ReglagesReservations | null;
  maintenant: Date;
  occupees?: readonly OccupationReservation[];
  personnes?: number;
};

export function listerJoursReservation(d: DemandeJoursReservation): JourReservation[] {
  const maintenantMs = d.maintenant.getTime();
  if (Number.isNaN(maintenantMs)) return [];
  const reglages = d.reglages ?? REGLAGES_RESERVATIONS_DEFAUT;
  const aujourdhui = calculerJourParis(maintenantMs);
  const parJour = new Map<string, OccupationReservation[]>();
  for (const occupee of d.occupees ?? []) {
    const jour = calculerJourParis(Date.parse(occupee.creneau));
    parJour.set(jour, [...(parJour.get(jour) ?? []), occupee]);
  }
  const lireEtat = (jour: string): EtatJourReservation => {
    const reels = listerCreneauxReels(d.ouverture, reglages, jour);
    const jourSemaine = lireJourSemaine(jour);
    if (reels.length === 0 && (jourSemaine === null || listerMinutesOuverture(d.ouverture, jourSemaine).length === 0)) return "ferme";
    if (reels.length === 0 || reglages.joursFermes.includes(jour)) return "sans-resa";
    const aTemps = reels.filter((c) => verifierDelaiReservation(reglages.delai, jour, c.heure, maintenantMs));
    if (aTemps.length === 0) return "trop-tard";
    const occupation = preparerOccupationJour(reglages.services, jour, parJour.get(jour) ?? []);
    const personnes = d.personnes ?? 1;
    const tient = ({ minute, service }: CreneauReel) =>
      service === null || calculerPlacesRestantes({ services: reglages.services, service, jour, minute }, occupation) >= personnes;
    return aTemps.some(tient) ? "ouvert" : "complet";
  };
  return Array.from({ length: JOURS_RESERVATION_MAX + 1 }, (_, i) => decalerJour(aujourdhui, i)).map((jour) => ({ jour, etat: lireEtat(jour) }));
}
