import { calculerInstantParis } from "@sos-miam/commun/fonctions/temps/calculer-instant-paris";
import { calculerJourParis } from "@sos-miam/commun/fonctions/temps/calculer-jour-paris";
import { decalerJour } from "@sos-miam/commun/fonctions/temps/decaler-jour";
import { choisirCodeAddition } from "@sos-miam/commun/fonctions/visites/choisir-code-addition";

import { LIEU_DEMO_PRO_ID } from "~/contenus/lieu-demo-pro";
import { tirerNombre } from "~/fonctions/demo/tirer-nombre";

import { listerCodesPrisDemo } from "./lister-codes-pris-demo";
import type { MagasinDemo } from "./types-demo";

const MINUTE = 60_000;

export function ajouterReservationsProDemo(m: MagasinDemo, maintenantMs: number): void {
  for (const r of m.reservations) {
    if (r.lieuId === LIEU_DEMO_PRO_ID && r.statut === "acceptee" && r.code === null) r.code = choisirCodeAddition(listerCodesPrisDemo(m, r.lieuId), tirerNombre);
  }
  m.reservations.push({
    id: m.prochainId,
    lieuId: LIEU_DEMO_PRO_ID,
    client: "figurant:karim",
    personnes: 4,
    creneau: new Date(calculerInstantParis(decalerJour(calculerJourParis(maintenantMs), 1), "12:30")).toISOString(),
    message: "On vient fêter la retraite de ma mère, elle adore les moules !",
    statut: "demandee",
    motifRefus: null,
    tardive: false,
    creeLe: new Date(maintenantMs - 20 * MINUTE).toISOString(),
    reponduLe: null,
    presenceLe: null,
    code: null,
    visiteId: null,
  });
  m.prochainId += 1;
}
