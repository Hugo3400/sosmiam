import { faireEvoluerVisite } from "../../../../../packages/commun/src/fonctions/visites/faire-evoluer-visite.ts";
import type { EvenementVisite, ReglementVisite } from "../../../../../packages/commun/src/types/visite.ts";
import type { LigneVisite, TablesVisites } from "../../services/visites-regles.ts";
import { appliquerEffetsVisite, type EffetsAppliques } from "./appliquer-effets-visite.ts";

/** Sans précision : payée */
const payee = (): ReglementVisite => ({ type: "paye", reductionPourcent: null, avantages: [] });

export type VisiteDecidee =
  | ({ ok: true; visite: LigneVisite } & Omit<EffetsAppliques, "champs">)
  | { ok: false; erreur: "transition-interdite" | "delai-depasse" };

/**
 * Décide une visite (réglée, refusée, annulée, expirée, retirée) avec la machine à états de packages/commun, l'écrit et
 * applique ses effets, dans la transaction. `parId` : le membre de l'équipe qui décide (null : le client ou l'heure).
 * `majeur` : le client de la visite (récompense figée selon son âge).
 */
export async function deciderVisite(
  t: TablesVisites, v: LigneVisite, evenement: EvenementVisite, maintenant: Date, majeur: boolean, parId: number | null,
): Promise<VisiteDecidee> {
  const transition = faireEvoluerVisite(
    { ...v, expireLe: v.expireLe?.toISOString() ?? null, valideLe: v.valideLe?.toISOString() ?? null },
    evenement,
    maintenant.getTime(),
  );
  if (!transition.ok) return transition;
  const { champs, ...reste } = await appliquerEffetsVisite(t, v, transition.effets, maintenant, majeur);
  const apres: LigneVisite = {
    ...v,
    statut: transition.statut,
    valideLe: transition.valideLe === null ? null : new Date(transition.valideLe),
    decideLe: new Date(transition.decideLe),
    decideParId: parId,
    points: transition.points,
    annulableJusqua: transition.annulableJusqua === null ? null : new Date(transition.annulableJusqua),
    ...(evenement.type === "refuser" || evenement.type === "annuler-lieu" ? { motifRefus: evenement.motif } : {}),
    ...(evenement.type === "regler" ? { reglement: evenement.reglement ?? payee() } : {}),
    ...champs,
  };
  const { id: _id, compteId: _compte, lieuId: _lieu, ...aEcrire } = apres;
  await t.modifierVisite(v.id, aEcrire);
  return { ok: true, visite: apres, ...reste };
}
