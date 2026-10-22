import { creerMotifMention } from "@sos-miam/commun/fonctions/commentaires/creer-motif-mention";

export type MorceauMessage = { texte: string; mention: boolean };

export function decouperMentions(texte: string, pseudos: ReadonlySet<string>): MorceauMessage[] {
  if (pseudos.size === 0 || !texte.includes("@")) return texte ? [{ texte, mention: false }] : [];
  return texte
    .split(creerMotifMention())
    .map((morceau, i) => ({ texte: morceau, mention: i % 2 === 1 && pseudos.has(morceau.slice(1).toLowerCase()) }))
    .filter((m) => m.texte !== "");
}
