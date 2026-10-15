import { ANNULATION_TARDIVE_MS } from "@sos-miam/commun/regles/reservations";
import type { Reservation } from "@sos-miam/commun/types/reservation";

import { decrireCreneauReservation } from "~/fonctions/reservations/decrire-creneau-reservation";
import { ecrireNombrePersonnes } from "~/fonctions/reservations/ecrire-nombre-personnes";
import { nommerPlaceReservation } from "~/fonctions/reservations/nommer-place-reservation";

export type TextesAnnulationReservation = { titre: string; detail: string; libelleConfirmer: string; libelleRester: string; annonce: string };

const HEURES_ANNULATION_TARDIVE = Math.round(ANNULATION_TARDIVE_MS / 3_600_000);

export function decrireAnnulationReservation(reservation: Reservation, tardive: boolean, maintenantMs: number): TextesAnnulationReservation {
  const creneau = decrireCreneauReservation(reservation.creneau, maintenantMs).lu;
  const quand = creneau.charAt(0).toLocaleLowerCase("fr-FR") + creneau.slice(1);
  const resume = `${reservation.lieu.nom}, ${quand}, ${ecrireNombrePersonnes(reservation.personnes)}.`;
  const place = nommerPlaceReservation(reservation.lieu.type);

  if (reservation.statut === "demandee") {
    return {
      titre: "Annuler ta demande ?",
      detail: `${resume} Le lieu n'a pas encore répondu : il ne cherchera pas de ${place} pour rien.`,
      libelleConfirmer: "Annuler la demande",
      libelleRester: "Je garde ma demande",
      annonce: "Demande annulée.",
    };
  }
  return {
    titre: "Annuler ta réservation ?",
    detail: tardive
      ? `${resume} Il reste moins de ${HEURES_ANNULATION_TARDIVE} h : le lieu verra passer cette annulation de dernière minute. Rien de grave si ça reste rare, promis.`
      : `${resume} En annulant maintenant, ta ${place} repart pour un autre Miami.`,
    libelleConfirmer: "Annuler la réservation",
    libelleRester: `Je garde ma ${place}`,
    annonce: "Réservation annulée.",
  };
}
