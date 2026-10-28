import { LIBELLES_MOTIF_REFUS_RESERVATION_PAR_LANGUE } from "@sos-miam/commun/contenus/motifs-refus";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { citer } from "@sos-miam/commun/fonctions/langue/citer";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { ANNULATION_TARDIVE_MS } from "@sos-miam/commun/regles/reservations";
import type { MotifRefusReservation, Reservation } from "@sos-miam/commun/types/reservation";

import { EXPLICATIONS_RESERVATION_PAR_LANGUE } from "~/contenus/textes-reservations-client";
import { estReservationNonPointee } from "~/fonctions/reservations/est-reservation-non-pointee";
import { nommerPlaceReservation } from "~/fonctions/reservations/nommer-place-reservation";

const HEURES_ANNULATION_TARDIVE = Math.round(ANNULATION_TARDIVE_MS / 3_600_000);

type Explications = (typeof EXPLICATIONS_RESERVATION_PAR_LANGUE)["fr"];

const citerMotif = (motif: MotifRefusReservation | null, langue: Langue) =>
  citer(choisirTextes(LIBELLES_MOTIF_REFUS_RESERVATION_PAR_LANGUE, langue)[motif ?? "autre"], langue);

function expliquerAnnulation(reservation: Reservation, T: Explications, langue: Langue): string {
  const place = nommerPlaceReservation(reservation.lieu.type);
  if (reservation.motifRefus) return T.annuleeParLieu(citerMotif(reservation.motifRefus, langue));
  if (reservation.reponduLe === null) return T.retireeAvantReponse(place);
  if (reservation.tardive) return T.annuleeTardive(HEURES_ANNULATION_TARDIVE);
  return T.annuleeATemps(place);
}

function expliquerAcceptee(reservation: Reservation, maintenantMs: number, T: Explications): string | null {
  if (!estReservationNonPointee(reservation, maintenantMs)) return null;
  return reservation.presenceLe ? T.nonPointeeAvecPresence : T.nonPointee;
}

function expliquerHonoree(reservation: Reservation, presencePossible: boolean, T: Explications): string {
  if (presencePossible) return T.honoreePresencePossible;
  return reservation.presenceLe ? T.honoreeAvecPresence : T.honoreeSansPresence;
}

export function expliquerReservation(reservation: Reservation, presencePossible: boolean, maintenantMs: number, langue: Langue): string | null {
  const T = choisirTextes(EXPLICATIONS_RESERVATION_PAR_LANGUE, langue);
  switch (reservation.statut) {
    case "demandee":
      return reservation.creneauxProposes.length > 1 ? T.demandeePlusieurs : T.demandee;
    case "acceptee":
      return expliquerAcceptee(reservation, maintenantMs, T);
    case "refusee":
      return T.refusee(citerMotif(reservation.motifRefus, langue), T.consolations[reservation.motifRefus ?? "autre"]);
    case "annulee":
      return expliquerAnnulation(reservation, T, langue);
    case "expiree":
      return T.expiree;
    case "honoree":
      return expliquerHonoree(reservation, presencePossible, T);
    case "absent":
      return T.absent(nommerPlaceReservation(reservation.lieu.type));
  }
}
