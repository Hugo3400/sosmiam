import type { MotifModeration } from "../../../../../packages/commun/src/contenus/motifs-moderation.ts";
import type { Prisma } from "../../base-de-donnees/client-genere/client.ts";

/**
 * La décision de l'équipe qui masque un avis (ou la réponse d'un lieu) à la relecture, telle qu'elle s'écrit dans la table
 * des signalements (les `data` du signalement.create, dans la transaction du masquage) : une ligne retenue sans personne
 * qui a signalé (raison « relecture », source « equipe »), avec la règle enfreinte et le pourquoi, au nom de l'auteur du
 * contenu (compteId : l'auteur de l'avis, ou le compte qui a écrit la réponse ; null s'il a été effacé). C'est elle que lit
 * « mes décisions » de l'app, contestable 6 mois.
 */
export function construireDecisionAvis(e: {
  cible: "avis" | "reponse-avis";
  avisId: number;
  lieuId: number;
  compteId: number | null;
  motif: MotifModeration;
  motivation: string;
  maintenant: Date;
}) {
  return {
    cible: e.cible,
    cibleId: String(e.avisId),
    lieuId: e.lieuId,
    raison: "relecture",
    explication: "",
    source: "equipe",
    statut: "retenu",
    motif: e.motif,
    motivation: e.motivation,
    traiteLe: e.maintenant,
    signaleParId: null,
    auteurContenuId: e.compteId,
  } satisfies Prisma.SignalementUncheckedCreateInput;
}
