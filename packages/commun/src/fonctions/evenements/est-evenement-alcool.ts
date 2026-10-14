import type { TypeLieu } from "../../types/lieu.ts";
import { parleDAlcool } from "../prevention/parle-d-alcool.ts";

/**
 * Vrai si un événement parle d'alcool : caché en visite sans compte (âge inconnu), avec le message sanitaire pour les
 * comptes. C'est la case « alcool » cochée, un titre ou une description qui parle d'alcool (mot d'alcool, happy hour,
 * verre : parleDAlcool, large exprès), ou un lieu de type bar (pas de bar sans compte). Relu à chaque lecture : un mot
 * ajouté plus tard à la liste compte aussi pour les événements déjà publiés.
 */
export function estEvenementAlcool(evenement: { alcool: boolean; titre: string; description: string }, typeLieu: TypeLieu): boolean {
  return evenement.alcool || typeLieu === "bar" || parleDAlcool(`${evenement.titre} · ${evenement.description}`);
}
