// Modifications de fiches de lieux proposées par un client ou par le lieu (décidé le 9 octobre 2026 ; schéma :
// prisma/schema/suggestions.prisma). Le logiciel montre l'avant, la fiche d'aujourd'hui et la proposition ; l'équipe
// accepte tout, une partie des champs, ou refuse, et peut répondre par mail à l'auteur.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import type { Prisma } from "../../base-de-donnees/client-genere/client.ts";
import { CHAMPS_SUGGERABLES, type ChampSuggerable } from "./champs-suggerables.ts";
import type { LieuSaisi } from "./lieux.ts";

const LIEU_COURT = { id: true, nom: true, emoji: true, ville: true, couleurs: true, statut: true } as const;
const AUTEUR = { id: true, prenom: true, email: true } as const;

/** Les suggestions d'un statut (« en-attente », « acceptee », « partielle », « refusee » ; vide : toutes), avec leur lieu. */
export async function listerSuggestions(statut: string, lieuId: number | null = null) {
  return baseDeDonnees.suggestionLieu.findMany({
    where: { ...(statut ? { statut } : {}), ...(lieuId ? { lieuId } : {}) },
    orderBy: { creeLe: statut === "en-attente" ? "asc" : "desc" },
    take: 200,
    include: { lieu: { select: LIEU_COURT }, compte: { select: AUTEUR } },
  });
}

/** Une suggestion, avec la fiche du lieu telle qu'elle est maintenant (pour « Avant / Maintenant / Proposé »). */
export async function lireSuggestion(id: number) {
  return baseDeDonnees.suggestionLieu.findUnique({ where: { id }, include: { lieu: true, compte: { select: AUTEUR } } });
}

export type DecisionSuggestion =
  | { etat: "introuvable" }
  | { etat: "decidee"; statut: "acceptee" | "partielle" | "refusee"; champs: ChampSuggerable[]; lieuId: number; compteId: number | null; nomLieu: string };

/**
 * Décide une suggestion en attente : `valeurs` contient les champs acceptés, déjà vérifiés (vide : refusée). Ils sont
 * écrits sur la fiche, et la suggestion passe à « acceptee » (tout ce qui était proposé et modifiable) ou « partielle ».
 */
export async function deciderSuggestion(id: number, valeurs: Partial<LieuSaisi>, reponse: string | null, maintenant = new Date()): Promise<DecisionSuggestion> {
  const suggestion = await baseDeDonnees.suggestionLieu.findFirst({
    where: { id, statut: "en-attente" },
    select: { lieuId: true, compteId: true, proposition: true, lieu: { select: { nom: true } } },
  });
  if (!suggestion) return { etat: "introuvable" };
  const champs = Object.keys(valeurs) as ChampSuggerable[];
  const proposes = Object.keys((suggestion.proposition ?? {}) as Record<string, unknown>).filter((champ) => (CHAMPS_SUGGERABLES as readonly string[]).includes(champ));
  const statut = champs.length === 0 ? "refusee" : proposes.every((champ) => champs.includes(champ as ChampSuggerable)) ? "acceptee" : "partielle";
  const { count } = await baseDeDonnees.$transaction(async (transaction) => {
    const decision = await transaction.suggestionLieu.updateMany({
      where: { id, statut: "en-attente" },
      data: { statut, champsAcceptes: champs, reponse, decideLe: maintenant },
    });
    if (decision.count > 0 && champs.length > 0) {
      await transaction.lieu.update({ where: { id: suggestion.lieuId }, data: valeurs as Prisma.LieuUpdateInput, select: { id: true } });
    }
    return decision;
  });
  if (count === 0) return { etat: "introuvable" };
  return { etat: "decidee", statut, champs, lieuId: suggestion.lieuId, compteId: suggestion.compteId, nomLieu: suggestion.lieu.nom };
}
