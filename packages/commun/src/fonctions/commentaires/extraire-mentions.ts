import { estPseudoValide } from "../../validation/est-pseudo-valide.ts";
import { creerMotifMention } from "./creer-motif-mention.ts";

/**
 * Les pseudos mentionnés avec « @ » dans un texte (sans doublon, sans le « @ », en minuscules, dans l'ordre) : seulement des
 * pseudos valables, jamais une adresse e-mail. L'API retrouve ensuite leur identifiant public (10 au plus).
 */
export function extraireMentions(texte: string): string[] {
  const trouves = [...texte.matchAll(creerMotifMention())].map((m) => m[1].slice(1).toLowerCase()).filter((pseudo) => estPseudoValide(pseudo));
  return [...new Set(trouves)];
}
