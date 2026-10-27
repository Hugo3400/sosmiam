import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { LienPublic, Reseau, TEXTES_LIENS_PUBLICS } from "~/contenus/liens-publics";

type TextesLiensPublics = Traduction<typeof TEXTES_LIENS_PUBLICS>;

export function assemblerLiensPublics(
  structure: readonly { reseau: Reseau; adresse: string; identifiant?: string }[],
  textes: TextesLiensPublics,
): LienPublic[] {
  return structure.map(({ reseau, adresse, identifiant }) => {
    const texte = textes.liens[reseau];
    return {
      reseau,
      nom: texte.nom,
      adresse,
      identifiant: "identifiant" in texte ? texte.identifiant : (identifiant ?? ""),
      accroche: texte.accroche,
    };
  });
}
