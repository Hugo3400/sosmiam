import { FORME_PSEUDO } from "@sos-miam/commun/regles/potes";

// Le corps de FORME_PSEUDO, sans ses ancres « ^ » et « $ » : la longueur et les caractères permis restent ceux des pseudos
const CORPS_PSEUDO = FORME_PSEUDO.source.replace(/^\^|\$$/g, "");

/**
 * Motif d'une mention « @pseudo » dans un texte, « @ » compris (groupe 1) : nouveau à chaque appel, car il est global.
 * Pas collé à ce qui précède (« contact@sosmiam.fr » n'est pas une mention), et le pseudo entier ou rien : « @ » suivi de
 * 25 lettres ne devient pas la mention des 20 premières. Un point final de phrase reste en dehors (« merci @lea. »).
 * Pour extraireMentions et TexteAvecMentions (mêmes mentions en gras que celles enregistrées).
 */
export function creerMotifMention(): RegExp {
  return new RegExp(`(?<![a-z0-9._@])(@${CORPS_PSEUDO})(?![a-z0-9_]|\\.[a-z0-9])`, "gi");
}
