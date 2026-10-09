// Suggestions de modification de fiches en mémoire, pour les tests : mêmes règles que suggestions-comptes.ts (Prisma),
// rien n'est écrit nulle part. Branché dans comptes-en-memoire.ts.
import {
  SUGGESTIONS_EN_ATTENTE_PAR_LIEU, SUGGESTIONS_PAR_JOUR, UN_JOUR, type FicheSuggerable, type NouvelleSuggestionCompte, type ResultatSuggestionCompte,
} from "./suggestions-comptes-regles.ts";

/** Un lieu de test : ses champs proposables et son statut (« brouillon », « publie » ou « masque ») */
export type LieuEnMemoire = FicheSuggerable & { statut: string };
export type SuggestionEnMemoire = NouvelleSuggestionCompte & {
  id: number; compteId: number | null; source: "client" | "pro"; statut: string; creeLe: number;
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
      const { statut: _statut, ...fiche } = lieu;
      return structuredClone(fiche);
    },
    async creerSuggestionLieu(compteId: number, nouvelle: NouvelleSuggestionCompte, maintenant = new Date(horloge())): Promise<ResultatSuggestionCompte> {
      const moment = maintenant.getTime();
      const duJour = suggestions.filter((s) => s.compteId === compteId && s.creeLe > moment - UN_JOUR).length;
      const enAttente = suggestions.filter((s) => s.compteId === compteId && s.lieuId === nouvelle.lieuId && s.statut === "en-attente").length;
      if (duJour >= SUGGESTIONS_PAR_JOUR || enAttente >= SUGGESTIONS_EN_ATTENTE_PAR_LIEU) return { ok: false, erreur: "trop-de-suggestions" };
      const id = ++compteur;
      suggestions.push({ ...structuredClone(nouvelle), id, compteId, source: "client", statut: "en-attente", creeLe: moment });
      return { ok: true, id };
    },
    /** Compte effacé : ses suggestions restent, sans auteur (comme onDelete: SetNull) */
    oublierCompte(compteId: number) {
      for (const suggestion of suggestions) if (suggestion.compteId === compteId) suggestion.compteId = null;
    },
  };
}
