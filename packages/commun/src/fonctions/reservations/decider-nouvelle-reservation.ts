import type { NouvelleReservationDecidee } from "../../types/decisions-reservations.ts";
import type { CreneauOuverture } from "../../types/lieu.ts";
import type { OccupationReservation, ReglagesReservations } from "../../types/reglages-reservations.ts";
import type { DemandeReservation } from "../../types/reservation.ts";
import { calculerCreneauxDemande } from "./calculer-creneaux-demande.ts";
import { listerCreneauxDisponibles } from "./lister-creneaux-disponibles.ts";

export type ContexteNouvelleReservation = {
  ouverture: readonly CreneauOuverture[];
  reglages: ReglagesReservations | null;
  occupees: readonly OccupationReservation[];
  maintenant: Date;
};

export function deciderNouvelleReservation(
  demande: Pick<DemandeReservation, "personnes" | "jour" | "heure" | "autresHeures">,
  c: ContexteNouvelleReservation,
): NouvelleReservationDecidee {
  const heures = [demande.heure, ...(demande.autresHeures ?? [])];
  const proposes = calculerCreneauxDemande(demande);
  const automatique = c.reglages !== null && c.reglages.acceptation === "automatique" && c.reglages.services.length > 0;
  if (!automatique) {
    const plusTot = proposes.reduce((a, b) => (Date.parse(b) < Date.parse(a) ? b : a));
    return { ok: true, statut: "demandee", creneau: plusTot, creneauxProposes: proposes, automatique: false };
  }
  const libres = new Set(listerCreneauxDisponibles({ ...c, jour: demande.jour, personnes: demande.personnes }).map((creneau) => creneau.heure));
  const retenue = heures.findIndex((heure) => libres.has(heure));
  if (retenue === -1) return { ok: false, erreur: "creneau-complet" };
  return { ok: true, statut: "acceptee", creneau: proposes[retenue]!, creneauxProposes: proposes, automatique: true };
}
