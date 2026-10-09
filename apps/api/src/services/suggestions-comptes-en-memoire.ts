// Suggestions de modification de fiches en mémoire, pour les tests : mêmes règles que suggestions-comptes.ts (Prisma),
// rien n'est écrit nulle part. Branché dans comptes-en-memoire.ts.
import {
  CHAMPS_PROPOSABLES, SUGGESTIONS_EN_ATTENTE_PAR_LIEU, SUGGESTIONS_PAR_JOUR, UN_JOUR, type FicheSuggerable, type NouvelleSuggestionCompte, type ResultatSuggestionCompte,
} from "./suggestions-comptes-regles.ts";

/**
 * Un lieu de test : ses champs proposables et son statut (« brouillon », « publie » ou « masque ») ; le reste de la fiche
 * (ville, catégorie…) est facultatif, avec des valeurs par défaut là où on le lit (pro-en-memoire.ts).
 */
export type LieuEnMemoire = FicheSuggerable & { statut: string } & Partial<{
  type: string; emoji: string; info: string; quartier: string; ville: string; prix: string; couleurs: string[]; decouvertPar: string | null;
}>;
export type SuggestionEnMemoire = NouvelleSuggestionCompte & {
  id: number; compteId: number | null; source: "client" | "pro"; statut: string; creeLe: number;
  /** Décision de l'équipe (les tests et la démo la posent à la main) */
  champsAcceptes?: string[]; reponse?: string | null; decideLe?: number | null;
};

export function creerSuggestionsEnMemoire(horloge: () => number) {
  const lieux = new Map<number, LieuEnMemoire>();
  const suggestions: SuggestionEnMemoire[] = [];
  let compteur = 0;
  return {
    lieux,
    suggestions,
    async lireFichePourSuggestion(lieuId: number): Promise<FicheSuggerable | null> {
      const lieu = lieux.get(lieuId);
      if (!lieu || lieu.statut !== "publie") return null;
      return structuredClone(Object.fromEntries(CHAMPS_PROPOSABLES.map((champ) => [champ, lieu[champ]])) as FicheSuggerable);
    },
    /** `source` : « client » (POST /comptes/moi/suggestions) ou « pro » (nom et adresse envoyés par le gérant) */
    async creerSuggestionLieu(
      compteId: number, nouvelle: NouvelleSuggestionCompte, maintenant = new Date(horloge()), source: "client" | "pro" = "client",
    ): Promise<ResultatSuggestionCompte> {
      const moment = maintenant.getTime();
      const duJour = suggestions.filter((s) => s.compteId === compteId && s.creeLe > moment - UN_JOUR).length;
      const enAttente = suggestions.filter((s) => s.compteId === compteId && s.lieuId === nouvelle.lieuId && s.statut === "en-attente").length;
      if (duJour >= SUGGESTIONS_PAR_JOUR || enAttente >= SUGGESTIONS_EN_ATTENTE_PAR_LIEU) return { ok: false, erreur: "trop-de-suggestions" };
      const id = ++compteur;
      suggestions.push({ ...structuredClone(nouvelle), id, compteId, source, statut: "en-attente", creeLe: moment });
      return { ok: true, id };
    },
    /** Compte effacé : ses suggestions restent, sans auteur (comme onDelete: SetNull) */
    oublierCompte(compteId: number) {
      for (const suggestion of suggestions) if (suggestion.compteId === compteId) suggestion.compteId = null;
    },
  };
}
