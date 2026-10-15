import type { LieuResume } from "@sos-miam/commun/types/lieu-resume";
import type { Reservation } from "@sos-miam/commun/types/reservation";

import { lieuxExemples } from "~/contenus/lieux-exemples";
import { resumerLieu } from "~/fonctions/lieux/resumer-lieu";

import type { ReservationDemo } from "./types-demo";

const resumerLieuDisparu = (id: number): LieuResume => ({ id, nom: "Lieu disparu", emoji: "📍", type: "resto", ville: "" });

export function convertirReservationDemo(r: ReservationDemo): Reservation {
  const lieu = lieuxExemples.find((l) => l.id === r.lieuId);
  const avecCode = r.statut === "acceptee" || r.statut === "honoree";
  return {
    id: r.id,
    lieu: lieu ? resumerLieu(lieu) : resumerLieuDisparu(r.lieuId),
    personnes: r.personnes,
    creneau: r.creneau,
    creneauxProposes: [r.creneau],
    automatique: false,
    message: r.message,
    statut: r.statut,
    motifRefus: r.motifRefus,
    tardive: r.tardive,
    creeLe: r.creeLe,
    reponduLe: r.reponduLe,
    presenceLe: r.presenceLe,
    code: avecCode ? r.code : null,
    visiteId: r.visiteId,
    demo: true,
  };
}
