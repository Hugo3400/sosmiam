import { lireMomentCreneau } from "@sos-miam/commun/fonctions/reservations/lire-moment-creneau";
import { nommerServiceReservation } from "@sos-miam/commun/fonctions/reservations/nommer-service-reservation";
import type { CreneauDisponible, EtatServiceDuJour, NomServiceReservation, ServiceDuJour } from "@sos-miam/commun/types/reglages-reservations";

export type GroupeCreneauxReservation = {
  cle: string;
  nom: NomServiceReservation;
  plage: { premier: string; dernier: string } | null;
  etat: EtatServiceDuJour;
  creneaux: CreneauDisponible[];
};

export function rangerCreneauxParService(disponibles: readonly CreneauDisponible[], services: readonly ServiceDuJour[]): GroupeCreneauxReservation[] {
  const tries = [...services].sort((a, b) => a.premier.localeCompare(b.premier));
  const groupes: GroupeCreneauxReservation[] = tries.map((service) => ({
    cle: `service-${service.premier}`,
    nom: nommerServiceReservation(service, tries),
    plage: { premier: service.premier, dernier: service.dernier },
    etat: service.etat,
    creneaux: disponibles.filter((c) => c.heure >= service.premier && c.heure <= service.dernier),
  }));
  const ranges = new Set(groupes.flatMap((g) => g.creneaux.map((c) => c.heure)));
  for (const creneau of disponibles) {
    if (ranges.has(creneau.heure)) continue;
    const moment = lireMomentCreneau(creneau.heure);
    const dernier = groupes.at(-1);
    if (dernier && dernier.plage === null && dernier.nom.moment === moment) dernier.creneaux.push(creneau);
    else groupes.push({ cle: `moment-${creneau.heure}`, nom: { moment, rang: null }, plage: null, etat: "ouvert", creneaux: [creneau] });
  }
  return groupes;
}
