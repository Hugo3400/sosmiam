import type { IdCategorieConsentement } from "~/contenus/cookies-consentement";
import type { ChoixConsentement } from "~/types/consentement";

/**
 * Vrai si la catégorie peut servir : les « necessaires » toujours ; une catégorie facultative seulement si elle a été
 * acceptée, dans un choix encore valable (même version, moins de 6 mois : voir lireChoixConsentement). Pas de choix,
 * pas de réponse, ou un refus : faux. Dans un composant, passer par utiliserConsentement().aConsenti(categorie).
 */
export function aConsenti(categorie: IdCategorieConsentement, choix: ChoixConsentement | null): boolean {
  if (categorie === "necessaires") return true;
  return choix?.reponses[categorie] === true;
}
