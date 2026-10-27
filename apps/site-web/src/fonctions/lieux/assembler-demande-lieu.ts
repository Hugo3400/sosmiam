import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { ChampDemandeLieu, STRUCTURE_DEMANDE_LIEU, StructureChampDemandeLieu, TEXTES_DEMANDE_LIEU } from "~/contenus/demande-lieu";

type TextesDemandeLieu = Traduction<typeof TEXTES_DEMANDE_LIEU>;
type Structure = typeof STRUCTURE_DEMANDE_LIEU;
type TypeDemandeLieu = Structure["types"][number];

export function assemblerDemandeLieu(structure: Structure, textes: TextesDemandeLieu) {
  const champ = ({ nom, ...reste }: StructureChampDemandeLieu): ChampDemandeLieu => {
    const texte = textes.champs[nom];
    return {
      nom,
      ...reste,
      libelle: texte.libelle,
      aide: "aide" in texte ? texte.aide : undefined,
      exemple: "exemple" in texte ? texte.exemple : reste.exemple,
      erreur: texte.erreur,
    };
  };
  return {
    champsLieu: structure.lieu.map(champ),
    champsContact: structure.contact.map(champ),
    types: structure.types.map((valeur): { valeur: TypeDemandeLieu; libelle: string } => ({ valeur, libelle: textes.types[valeur] })),
  };
}
