// Suggestions de modification d'une fiche de lieu envoyées par un compte (client) : la fiche publiée telle qu'elle est,
// et l'enregistrement avec ses limites. Règles et formes : suggestions-comptes-regles.ts ; décision : logiciel de gestion.
import type { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import {
  CHAMPS_PROPOSABLES, SUGGESTIONS_EN_ATTENTE_PAR_LIEU, SUGGESTIONS_PAR_JOUR, UN_JOUR,
  type FicheSuggerable, type NouvelleSuggestionCompte, type ResultatSuggestionCompte,
} from "./suggestions-comptes-regles.ts";

const SELECTION = Object.fromEntries(CHAMPS_PROPOSABLES.map((champ) => [champ, true])) as Record<(typeof CHAMPS_PROPOSABLES)[number], true>;

/** Les champs proposables d'un lieu publié ; null s'il n'existe pas ou n'est pas publié. */
export async function lireFichePourSuggestion(lieuId: number): Promise<FicheSuggerable | null> {
  return baseDeDonnees.lieu.findFirst({ where: { id: lieuId, statut: "publie" }, select: SELECTION });
}

/**
 * Enregistre la suggestion (source « client », « en-attente »), sauf si le compte en a déjà envoyé 10 dans les dernières
 * 24 heures, ou en a déjà 3 en attente sur ce lieu.
 */
export async function creerSuggestionLieu(
  compteId: number, { lieuId, proposition, avant, message }: NouvelleSuggestionCompte, maintenant = new Date(),
): Promise<ResultatSuggestionCompte> {
  return baseDeDonnees.$transaction(async (transaction) => {
    const [duJour, enAttente] = await Promise.all([
      transaction.suggestionLieu.count({ where: { compteId, creeLe: { gt: new Date(maintenant.getTime() - UN_JOUR) } } }),
      transaction.suggestionLieu.count({ where: { compteId, lieuId, statut: "en-attente" } }),
    ]);
    if (duJour >= SUGGESTIONS_PAR_JOUR || enAttente >= SUGGESTIONS_EN_ATTENTE_PAR_LIEU) return { ok: false, erreur: "trop-de-suggestions" } as const;
    const { id } = await transaction.suggestionLieu.create({
      data: {
        lieuId, compteId, source: "client", message, creeLe: maintenant,
        proposition: proposition as Prisma.InputJsonObject, avant: avant as Prisma.InputJsonObject,
      },
      select: { id: true },
    });
    return { ok: true, id } as const;
  });
}
