import type { TypeLieu } from "../../types/lieu.ts";
import { parleDAlcool } from "../prevention/parle-d-alcool.ts";

/**
 * Vrai si un événement est à cacher aux 15-17 ans (et à l'âge inconnu), avec le message sanitaire à côté : la case
 * « alcool » cochée, un titre ou une description qui parle d'alcool (mot d'alcool, happy hour, verre : parleDAlcool, large
 * exprès), ou un lieu de type bar (un bar n'existe pas pour un 15-17 ans). Relu à chaque lecture : un mot ajouté plus tard
 * à la liste compte aussi pour les événements déjà publiés.
 */
export function estEvenementAlcool(evenement: { alcool: boolean; titre: string; description: string }, typeLieu: TypeLieu): boolean {
  return evenement.alcool || typeLieu === "bar" || parleDAlcool(`${evenement.titre} · ${evenement.description}`);
}
