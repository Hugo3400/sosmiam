import { faireEvoluerReservation } from "@sos-miam/commun/fonctions/reservations/faire-evoluer-reservation";
import { choisirCodeAddition } from "@sos-miam/commun/fonctions/visites/choisir-code-addition";
import type { EvenementReservation, TransitionReservation } from "@sos-miam/commun/types/reservation";

import { tirerNombre } from "~/fonctions/demo/tirer-nombre";

import { creerVisiteValideeDemo } from "./creer-visite-validee-demo";
import { listerCodesPrisDemo } from "./lister-codes-pris-demo";
import type { ClientDemo, MagasinDemo, ReservationDemo, VisiteDemo } from "./types-demo";

type EchecTransition = Extract<TransitionReservation, { ok: false }>;

export type DecisionReservationDemo = { ok: true; visite: VisiteDemo | null; recompenseGagnee: boolean } | EchecTransition;

type ContexteDecision = { maintenantMs: number; client: ClientDemo | null; delaiAvisMs: number };

function noterReponseDuLieu(m: MagasinDemo, r: ReservationDemo, evenement: EvenementReservation, le: string) {
  if (evenement.type === "accepter" || evenement.type === "refuser") r.reponduLe = le;
  if (evenement.type === "accepter") r.code = choisirCodeAddition(listerCodesPrisDemo(m, r.lieuId), tirerNombre);
  if (evenement.type === "refuser" || evenement.type === "annuler-lieu") r.motifRefus = evenement.motif;
}

export function deciderReservationDemo(m: MagasinDemo, r: ReservationDemo, evenement: EvenementReservation, o: ContexteDecision): DecisionReservationDemo {
  const transition = faireEvoluerReservation(r, evenement, o.maintenantMs);
  if (!transition.ok) return transition;
  r.statut = transition.statut;
  r.presenceLe = transition.presenceLe;
  r.tardive = r.tardive || transition.tardive;
  if (r.statut !== "acceptee" && r.statut !== "honoree") r.code = null;
  noterReponseDuLieu(m, r, evenement, new Date(o.maintenantMs).toISOString());

  const creerVisite = transition.effets.some((effet) => effet.type === "creer-visite");
  if (!creerVisite || !o.client) return { ok: true, visite: null, recompenseGagnee: false };
  const nee = creerVisiteValideeDemo(m, {
    lieuId: r.lieuId,
    client: o.client,
    mode: "reservation",
    presentationId: null,
    reservationId: r.id,
    resultatPosition: "dans-rayon",
    maintenantMs: o.maintenantMs,
    delaiAvisMs: o.delaiAvisMs,
  });
  r.visiteId = nee.visite.id;
  return { ok: true, visite: nee.visite, recompenseGagnee: nee.recompenseGagnee };
}
