import { decouperTexteRiche } from "~/fonctions/texte/decouper-texte-riche";

/** Garde seulement le texte lisible : « **Offre** : [ici](/x) » → « Offre : ici ». */
export function retirerMiseEnForme(texte: string): string {
  return decouperTexteRiche(texte).map((morceau) => morceau.texte).join("");
}
