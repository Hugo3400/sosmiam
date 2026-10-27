import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { LANGUE_PAR_DEFAUT, type Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { TEXTES_MESSAGE_COMPTE_LIMITE_PAR_LANGUE } from "../../contenus/message-compte-limite.ts";
import { decrireFinLimitation } from "./decrire-fin-limitation.ts";

/**
 * Le message d'une page qui écrit, quand l'API répond 403 « compte-limite » (details.jusqua) : rien n'est parti, pourquoi,
 * et où lire le motif et contester.
 */
export function expliquerCompteLimite(jusqua: string | null | undefined, langue: Langue = LANGUE_PAR_DEFAUT): string {
  const T = choisirTextes(TEXTES_MESSAGE_COMPTE_LIMITE_PAR_LANGUE, langue);
  return T.message(decrireFinLimitation(jusqua, langue), T.monCompte);
}
