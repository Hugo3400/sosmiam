import { calculerPlacesRestantes } from "@sos-miam/commun/fonctions/reservations/calculer-places-restantes";
import { listerMinutesDuService } from "@sos-miam/commun/fonctions/reservations/lister-minutes-du-service";
import { preparerOccupationJour } from "@sos-miam/commun/fonctions/reservations/preparer-occupation-jour";
import { calculerInstantParis } from "@sos-miam/commun/fonctions/temps/calculer-instant-paris";
import { calculerJourParis } from "@sos-miam/commun/fonctions/temps/calculer-jour-paris";
import { ecrireHeureMinutes } from "@sos-miam/commun/fonctions/temps/ecrire-heure-minutes";
import { existeHeureParis } from "@sos-miam/commun/fonctions/temps/existe-heure-paris";
import { lireJourSemaine } from "@sos-miam/commun/fonctions/temps/lire-jour-semaine";
import { STATUTS_QUI_OCCUPENT } from "@sos-miam/commun/regles/reglages-reservations";
import type { ReglagesReservations, ServiceReservation } from "@sos-miam/commun/types/reglages-reservations";
import type { ReservationPro } from "@sos-miam/commun/types/reservation";

export type RemplissageCreneau = { heure: string; acceptes: number; arrivees: number; restantes: number; demandes: number; personnesEnAttente: number };

export type RemplissageService = { service: ServiceReservation; acceptes: number; capacite: number; creneaux: RemplissageCreneau[] };

export type RemplissageJour = { etat: "sans-service" | "jour-sans-resa" | "finis" | "ouvert"; services: RemplissageService[] };

const CRENEAU_PASSE_MS = 30 * 60_000;

export function calculerRemplissageJour(reglages: ReglagesReservations, reservations: readonly ReservationPro[], maintenantMs: number): RemplissageJour {
  const jour = calculerJourParis(maintenantMs);
  const jourSemaine = lireJourSemaine(jour);
  const duJour = reglages.services.filter((s) => jourSemaine !== null && s.jours.includes(jourSemaine)).sort((a, b) => a.premier.localeCompare(b.premier));
  if (duJour.length === 0) return { etat: "sans-service", services: [] };
  const occupees = reservations.filter((r) => STATUTS_QUI_OCCUPENT.includes(r.statut)).map((r) => ({ creneau: r.creneau, personnes: r.personnes }));
  const occupation = preparerOccupationJour(reglages.services, jour, occupees);
  const demandes = reservations.filter((r) => r.statut === "demandee");
  const services = duJour.map((service): RemplissageService => {
    const pasMs = service.pas * 60_000;
    const creneaux = listerMinutesDuService(service).flatMap((minute): RemplissageCreneau[] => {
      const heure = ecrireHeureMinutes(minute);
      if (!existeHeureParis(jour, heure)) return [];
      const debut = calculerInstantParis(jour, heure);
      if (debut < maintenantMs - CRENEAU_PASSE_MS) return [];
      const dedans = (iso: string) => Date.parse(iso) >= debut && Date.parse(iso) < debut + pasMs;
      const acceptes = occupation.tables.filter((t) => t.instant >= debut && t.instant < debut + pasMs).reduce((somme, t) => somme + t.personnes, 0);
      const visant = demandes.filter((r) => r.propositions.some((p) => dedans(p.creneau)));
      return [{
        heure,
        acceptes,
        arrivees: service.couvertsParCreneau,
        restantes: calculerPlacesRestantes({ services: reglages.services, service, jour, minute }, occupation),
        demandes: visant.length,
        personnesEnAttente: visant.reduce((somme, r) => somme + r.personnes, 0),
      }];
    });
    return { service, acceptes: occupation.parService.get(service) ?? 0, capacite: service.couvertsParService, creneaux };
  });
  if (reglages.joursFermes.includes(jour)) return { etat: "jour-sans-resa", services };
  return { etat: services.every((s) => s.creneaux.length === 0) ? "finis" : "ouvert", services };
}
