import { JOURS_RESERVATION_MAX } from "../../regles/reservations.ts";
import { REGLAGES_RESERVATIONS_DEFAUT } from "../../regles/reglages-reservations.ts";
import type { OccupationReservation, ReglagesReservations, ServiceDuJour } from "../../types/reglages-reservations.ts";
import { calculerEcartJoursParis } from "../temps/calculer-ecart-jours-paris.ts";
import { ecrireHeureMinutes } from "../temps/ecrire-heure-minutes.ts";
import { existeHeureParis } from "../temps/existe-heure-paris.ts";
import { lireJourSemaine } from "../temps/lire-jour-semaine.ts";
import { calculerPlacesRestantes } from "./calculer-places-restantes.ts";
import { listerMinutesDuService } from "./lister-minutes-du-service.ts";
import { preparerOccupationJour } from "./preparer-occupation-jour.ts";
import { verifierDelaiReservation } from "./verifier-delai-reservation.ts";

export type DemandeServicesDuJour = {
  reglages: ReglagesReservations | null;
  jour: string;
  maintenant: Date;
  occupees?: readonly OccupationReservation[];
  personnes?: number;
};

export function listerServicesDuJour(d: DemandeServicesDuJour): ServiceDuJour[] {
  const reglages = d.reglages ?? REGLAGES_RESERVATIONS_DEFAUT;
  const maintenantMs = d.maintenant.getTime();
  const jourSemaine = lireJourSemaine(d.jour);
  const ecart = calculerEcartJoursParis(d.jour, maintenantMs);
  if (jourSemaine === null || ecart === null || ecart < 0 || ecart > JOURS_RESERVATION_MAX || reglages.joursFermes.includes(d.jour)) return [];
  const personnes = d.personnes ?? 1;
  const occupation = preparerOccupationJour(reglages.services, d.jour, d.occupees ?? []);
  return reglages.services
    .filter((service) => service.jours.includes(jourSemaine))
    .sort((a, b) => a.premier.localeCompare(b.premier))
    .flatMap((service): ServiceDuJour[] => {
      const minutes = listerMinutesDuService(service).filter((minute) => existeHeureParis(d.jour, ecrireHeureMinutes(minute)));
      if (minutes.length === 0) return [];
      const decrire = (etat: ServiceDuJour["etat"]): ServiceDuJour[] => [{ premier: service.premier, dernier: service.dernier, pas: service.pas, etat }];
      const aTemps = minutes.filter((minute) => verifierDelaiReservation(reglages.delai, d.jour, ecrireHeureMinutes(minute), maintenantMs));
      if (aTemps.length === 0) return decrire("trop-tard");
      const libre = aTemps.some((minute) => calculerPlacesRestantes({ services: reglages.services, service, jour: d.jour, minute }, occupation) >= personnes);
      return decrire(libre ? "ouvert" : "complet");
    });
}
