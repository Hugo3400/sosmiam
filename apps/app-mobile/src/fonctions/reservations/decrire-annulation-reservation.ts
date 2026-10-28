import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { ANNULATION_TARDIVE_MS } from "@sos-miam/commun/regles/reservations";
import type { Reservation } from "@sos-miam/commun/types/reservation";

import { ANNULATION_RESERVATION_PAR_LANGUE } from "~/contenus/textes-reservations-client";
import { ecrireNombrePersonnesLangue } from "~/fonctions/langue/ecrire-nombre-personnes-langue";
import { ecrireQuandReservation } from "~/fonctions/reservations/ecrire-quand-reservation";
import { nommerPlaceReservation } from "~/fonctions/reservations/nommer-place-reservation";

export type TextesAnnulationReservation = { titre: string; detail: string; libelleConfirmer: string; libelleRester: string; annonce: string };

const HEURES_ANNULATION_TARDIVE = Math.round(ANNULATION_TARDIVE_MS / 3_600_000);

export function decrireAnnulationReservation(reservation: Reservation, tardive: boolean, maintenantMs: number, langue: Langue): TextesAnnulationReservation {
  const T = choisirTextes(ANNULATION_RESERVATION_PAR_LANGUE, langue);
  const quand = ecrireQuandReservation(reservation.creneau, maintenantMs, langue);
  const resume = `${reservation.lieu.nom}, ${quand}, ${ecrireNombrePersonnesLangue(reservation.personnes, langue)}.`;
  const place = nommerPlaceReservation(reservation.lieu.type);

  if (reservation.statut === "demandee") {
    const { titre, libelleConfirmer, libelleRester, annonce } = T.demande;
    return { titre, detail: T.demande.detail(resume, place), libelleConfirmer, libelleRester, annonce };
  }
  return {
    titre: T.reservation.titre,
    detail: tardive ? T.reservation.detailTardive(resume, HEURES_ANNULATION_TARDIVE) : T.reservation.detail(resume, place),
    libelleConfirmer: T.reservation.libelleConfirmer,
    libelleRester: T.reservation.libelleRester(place),
    annonce: T.reservation.annonce,
  };
}
