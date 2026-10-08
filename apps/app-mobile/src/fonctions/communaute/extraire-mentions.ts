import { estPseudoValide } from "@sos-miam/commun/validation/est-pseudo-valide";

import { creerMotifMention } from "./creer-motif-mention";

/** Les pseudos mentionnés avec « @ » dans un texte (sans doublon, sans le « @ ») : seulement des pseudos valables, jamais une adresse e-mail. */
export function extraireMentions(texte: string): string[] {
  const trouves = [...texte.matchAll(creerMotifMention())].map((m) => m[1].slice(1).toLowerCase()).filter((pseudo) => estPseudoValide(pseudo));
  return [...new Set(trouves)];
}
