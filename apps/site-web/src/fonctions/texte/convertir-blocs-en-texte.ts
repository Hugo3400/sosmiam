import type { BlocTexte } from "~/contenus/type-bloc-texte";
import { retirerMiseEnForme } from "~/fonctions/texte/retirer-mise-en-forme";

/** Met des blocs de texte (réponse de la FAQ, page légale) en texte brut : recherche, données pour Google. */
export function convertirBlocsEnTexte(blocs: BlocTexte[]): string {
  return blocs
    .flatMap((bloc) => {
      if (typeof bloc === "string") return [bloc];
      if ("liste" in bloc) return bloc.liste;
      return bloc.tableau.lignes.map((ligne) => ligne.join(" : "));
    })
    .map(retirerMiseEnForme)
    .join(" ");
}
