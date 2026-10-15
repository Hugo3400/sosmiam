import { PAS_CRENEAUX_MIN } from "../../regles/reservations.ts";
import type { CreneauOuverture } from "../../types/lieu.ts";
import type { ServiceReservation } from "../../types/reglages-reservations.ts";
import { ecrireHeureMinutes } from "../temps/ecrire-heure-minutes.ts";
import { listerMinutesOuverture } from "./lister-minutes-ouverture.ts";

export function creerServicesDepuisHoraires(ouverture: readonly CreneauOuverture[], couvertsParService: number): ServiceReservation[] {
  const parHoraires = new Map<string, ServiceReservation>();
  const ajouter = (jourSemaine: number, premier: number, dernier: number) => {
    const cle = `${premier}-${dernier}`;
    const service = parHoraires.get(cle);
    if (service) service.jours.push(jourSemaine);
    else {
      parHoraires.set(cle, {
        jours: [jourSemaine], premier: ecrireHeureMinutes(premier), dernier: ecrireHeureMinutes(dernier), pas: PAS_CRENEAUX_MIN,
        couvertsParService, couvertsParCreneau: couvertsParService,
      });
    }
  };
  for (let jourSemaine = 0; jourSemaine < 7; jourSemaine += 1) {
    let debut: number | null = null;
    let precedent: number | null = null;
    for (const minute of [...listerMinutesOuverture(ouverture, jourSemaine), Number.POSITIVE_INFINITY]) {
      if (precedent !== null && minute === precedent + PAS_CRENEAUX_MIN) {
        precedent = minute;
        continue;
      }
      if (debut !== null && precedent !== null) ajouter(jourSemaine, debut, precedent);
      debut = minute;
      precedent = minute;
    }
  }
  return [...parHoraires.values()].sort((a, b) => a.premier.localeCompare(b.premier) || a.jours[0]! - b.jours[0]!);
}
