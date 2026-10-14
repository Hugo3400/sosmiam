import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import { faireEvoluerVisite } from "@sos-miam/commun/fonctions/visites/faire-evoluer-visite";
import type { EvenementVisite } from "@sos-miam/commun/types/visite";

import { appliquerEffetsVisite } from "./appliquer-effets-demo";
import type { MagasinDemo, VisiteDemo } from "./types-demo";

/**
 * Décide une visite du magasin (réglée, refusée, annulée, expirée, retirée) avec les règles de commun, puis applique
 * ses effets.
 */
export function deciderVisiteDemo(
  m: MagasinDemo,
  visiteId: number,
  evenement: EvenementVisite,
  maintenantMs: number,
  delaiAvisMs: number,
): ReponseApi<{ visite: VisiteDemo }> {
  const v = m.visites.find((x) => x.id === visiteId);
  if (!v) return { ok: false, erreur: "introuvable" };
  const transition = faireEvoluerVisite(v, evenement, maintenantMs, { delaiAvisMs });
  if (!transition.ok) return { ok: false, erreur: transition.erreur };
  v.statut = transition.statut;
  v.valideLe = transition.valideLe;
  v.decideLe = transition.decideLe;
  v.points = transition.points;
  v.annulableJusqua = transition.annulableJusqua;
  if (evenement.type === "refuser" || evenement.type === "annuler-lieu") v.motifRefus = evenement.motif;
  if (evenement.type === "regler") v.reglement = evenement.reglement ?? { type: "paye", reductionPourcent: null, avantages: [] };
  appliquerEffetsVisite(m, v, transition.effets, maintenantMs);
  return { ok: true, visite: v };
}
