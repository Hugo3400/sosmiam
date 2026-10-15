import { DUREE_CONTESTATION_JOURS } from "../../../../../packages/commun/src/regles/signalement.ts";
import type { CibleDecisionModeration, DecisionModerationApi } from "../../../../../packages/commun/src/types/signalement.ts";

const JOUR_MS = 24 * 60 * 60 * 1000;

/** Ce qu'on lit d'un signalement pour le montrer dans « Décisions de la modération » (jamais qui l'a fait, ni son explication) */
export type LigneDecisionModeration = {
  id: number;
  /** Un contenu social, ou un avis et la réponse d'un lieu à un avis (masqués par l'équipe à la relecture) */
  cible: CibleDecisionModeration;
  statut: string;
  motif: string | null;
  motivation: string | null;
  traiteLe: Date | null;
  contesteLe: Date | null;
  reexamineLe: Date | null;
};

/**
 * Une décision de la modération au format de l'app (DecisionModerationApi). Un signalement pas encore jugé ne se montre qu'à
 * l'auteur d'un contenu masqué en attendant (statut « masque »). On peut contester pendant 6 mois après la décision : l'auteur
 * un contenu retiré (« retenu »), celui qui a signalé un signalement rejeté ; contestableJusqua est null pour les autres.
 */
export function presenterDecisionModeration(s: LigneDecisionModeration, role: "auteur" | "signale"): DecisionModerationApi {
  const juge = s.statut === "retenu" || s.statut === "rejete";
  const statut = juge ? (s.statut as "retenu" | "rejete") : "masque";
  const contestable = juge && s.traiteLe !== null && ((role === "auteur" && statut === "retenu") || (role === "signale" && statut === "rejete"));
  return {
    id: String(s.id),
    cible: s.cible,
    role,
    statut,
    motif: statut === "retenu" ? s.motif : null,
    motivation: juge ? s.motivation : null,
    decideLe: juge ? s.traiteLe?.toISOString() ?? null : null,
    contestableJusqua: contestable ? new Date(s.traiteLe!.getTime() + DUREE_CONTESTATION_JOURS * JOUR_MS).toISOString() : null,
    contestation: s.contesteLe === null ? "aucune" : s.reexamineLe === null ? "envoyee" : "reexaminee",
  };
}
