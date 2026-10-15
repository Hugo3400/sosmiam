import type { TypeClocheCommunaute } from "../../../../../packages/commun/src/types/communaute.ts";
import type { EffetSocial } from "../../services/effets-sociaux-regles.ts";
import { ecrirePushCommunaute, type EvenementPushCommunaute } from "./ecrire-push-communaute.ts";

export type EvenementCommunaute = {
  type: TypeClocheCommunaute;
  acteurId: number | null;
  cible: { type: "miamis" | "idee"; id: number } | null;
  detail: string;
  destinataires: readonly number[];
  push?: { evenement: EvenementPushCommunaute; autorises: ReadonlySet<number> };
};

export function construireEffetsCommunaute(e: EvenementCommunaute): EffetSocial[] {
  const effets: EffetSocial[] = [];
  for (const compteId of new Set(e.destinataires)) {
    if (compteId === e.acteurId) continue;
    effets.push({
      quoi: "cloche",
      notification: { compteId, type: e.type, acteurId: e.acteurId, ...(e.detail ? { detail: e.detail } : {}), ...(e.cible ? { cible: { type: e.cible.type, id: String(e.cible.id) } } : {}) },
    });
    if (e.push?.autorises.has(compteId)) effets.push({ quoi: "push", compteId, sorte: "communaute", message: ecrirePushCommunaute(e.push.evenement) });
  }
  return effets;
}
