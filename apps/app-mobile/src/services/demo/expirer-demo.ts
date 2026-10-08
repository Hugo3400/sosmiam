// Ce qui expire tout seul dans la démo, relu à chaque lecture et à chaque modification du magasin (comme le ferait
// l'API) : additions sans réponse (30 min), QR montrés (gardés 24 h), demandes de récompense (15 min), réservations.
import { faireEvoluerReservation } from "@sos-miam/commun/fonctions/reservations/faire-evoluer-reservation";
import { DELAI_INVITATION_AVIS_MS } from "@sos-miam/commun/regles/visites";

import { deciderVisiteDemo } from "./decider-visite-demo";
import type { MagasinDemo } from "./types-demo";

/** Un QR montré est oublié 24 h après s'être éteint (il ne sert plus qu'à reconnaître un second scan) */
const GARDE_PRESENTATIONS_MS = 24 * 60 * 60_000;

const estPasse = (iso: string | null, maintenantMs: number) => iso !== null && Date.parse(iso) <= maintenantMs;

/** Expire ce qui doit l'être ; vrai si quelque chose a changé (il faudra enregistrer et prévenir les écrans). */
export function expirerDemo(m: MagasinDemo, maintenantMs: number): boolean {
  let change = false;

  for (const v of m.visites) {
    if (v.statut !== "demandee" || !estPasse(v.expireLe, maintenantMs)) continue;
    if (deciderVisiteDemo(m, v.id, { type: "expirer" }, maintenantMs, DELAI_INVITATION_AVIS_MS).ok) change = true;
  }

  const gardees = m.presentations.filter((p) => Date.parse(p.expireLe) + GARDE_PRESENTATIONS_MS > maintenantMs);
  if (gardees.length !== m.presentations.length) {
    m.presentations = gardees;
    change = true;
  }

  for (const carte of m.cartes) {
    if (carte.demande && estPasse(carte.demande.expireLe, maintenantMs)) {
      carte.demande = null;
      change = true;
    }
  }

  for (const r of m.reservations) {
    if (r.statut !== "demandee") continue;
    const transition = faireEvoluerReservation(r, { type: "expirer" }, maintenantMs);
    if (!transition.ok) continue;
    r.statut = transition.statut;
    r.presenceLe = transition.presenceLe;
    r.tardive = transition.tardive;
    change = true;
  }

  return change;
}
