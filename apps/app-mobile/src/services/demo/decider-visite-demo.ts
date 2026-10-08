import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import { faireEvoluerVisite } from "@sos-miam/commun/fonctions/visites/faire-evoluer-visite";
import type { EvenementVisite } from "@sos-miam/commun/types/visite";

import { appliquerEffetsVisite } from "./appliquer-effets-demo";
import { trouverClientDemo } from "./trouver-client-demo";
import type { ClientDemo, MagasinDemo, VisiteDemo } from "./types-demo";

/**
 * Décide une visite du magasin (réglée, refusée, annulée, expirée, retirée) avec les règles de commun, puis applique
 * ses effets. `moi` (lireClient()) sert à figer la bonne récompense quand la carte de « moi » se remplit ; sans lui,
 * on reste prudent (récompense sans alcool).
 */
export function deciderVisiteDemo(
  m: MagasinDemo,
  visiteId: number,
  evenement: EvenementVisite,
  maintenantMs: number,
  delaiAvisMs: number,
  moi: ClientDemo | null = null,
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
  appliquerEffetsVisite(m, v, transition.effets, maintenantMs, trouverClientDemo(m, v.client, moi));
  return { ok: true, visite: v };
}
