import { STATUTS_QUI_OCCUPENT } from "../../regles/reglages-reservations.ts";
import type {
  OccupationReservation, RaisonReservationARevoir, ReglagesReservations, ReservationAComparer, ReservationARevoir,
} from "../../types/reglages-reservations.ts";
import { calculerJourParis } from "../temps/calculer-jour-paris.ts";
import { lireHeureParis } from "../temps/lire-heure-paris.ts";
import { lireJourSemaine } from "../temps/lire-jour-semaine.ts";
import { lireMinutesHeure } from "../temps/lire-minutes-heure.ts";
import { calculerPlacesRestantes } from "./calculer-places-restantes.ts";
import { lireCreneauxProposes } from "./lire-creneaux-proposes.ts";
import type { MinuteDeService } from "./lister-minutes-services.ts";
import { preparerOccupationJour } from "./preparer-occupation-jour.ts";
import type { OccupationJour } from "./preparer-occupation-jour.ts";
import { trouverServiceReservation } from "./trouver-service-reservation.ts";

type Situation = { raison: RaisonReservationARevoir } | { jour: string; trouve: MinuteDeService } | null;

export function listerReservationsARevoir(
  reglages: ReglagesReservations,
  reservations: readonly ReservationAComparer[],
  maintenant: Date,
): ReservationARevoir[] {
  const maintenantMs = maintenant.getTime();
  const occupees: OccupationReservation[] = reservations
    .filter((r) => STATUTS_QUI_OCCUPENT.includes(r.statut))
    .map((r) => ({ creneau: r.creneau, personnes: r.personnes }));
  const parJour = new Map<string, OccupationJour>();
  const lireOccupation = (jour: string) => {
    const lue = parJour.get(jour) ?? preparerOccupationJour(reglages.services, jour, occupees);
    parJour.set(jour, lue);
    return lue;
  };
  const situer = (creneau: string): Situation => {
    const instant = Date.parse(creneau);
    if (Number.isNaN(instant)) return null;
    const jour = calculerJourParis(instant);
    if (reglages.joursFermes.includes(jour)) return { raison: "jour-ferme" };
    if (reglages.services.length === 0) return null;
    const jourSemaine = lireJourSemaine(jour);
    const minute = lireMinutesHeure(lireHeureParis(instant));
    const trouve = jourSemaine === null || minute === null ? null : trouverServiceReservation(reglages.services, jourSemaine, minute);
    return trouve ? { jour, trouve } : { raison: "hors-service" };
  };
  return reservations.flatMap((r): ReservationARevoir[] => {
    if ((r.statut !== "demandee" && r.statut !== "acceptee") || !(Date.parse(r.creneau) >= maintenantMs)) return [];
    if (r.statut === "demandee") {
      const situations = lireCreneauxProposes(r).map(situer);
      const premiere = situations[0];
      if (!premiere || !("raison" in premiere) || !situations.every((s) => s !== null && "raison" in s)) return [];
      return [{ id: r.id, creneau: r.creneau, raison: premiere.raison }];
    }
    const situation = situer(r.creneau);
    if (situation === null) return [];
    if ("raison" in situation) return [{ id: r.id, creneau: r.creneau, raison: situation.raison }];
    const { jour, trouve } = situation;
    const restantes = calculerPlacesRestantes({ services: reglages.services, service: trouve.service, jour, minute: trouve.minute }, lireOccupation(jour));
    return restantes < 0 ? [{ id: r.id, creneau: r.creneau, raison: "capacite" }] : [];
  });
}
