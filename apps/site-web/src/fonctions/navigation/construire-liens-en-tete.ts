import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { GroupeEnTete, LienEnTete, TEXTES_EN_TETE } from "~/contenus/liens-en-tete";
import { ecrireCheminLangue } from "~/fonctions/langue/ecrire-chemin-langue";

type TextesEnTete = Traduction<typeof TEXTES_EN_TETE>;
type CleLien = keyof TextesEnTete["liens"];

const ADRESSES: Record<CleLien, Omit<LienEnTete, "texte" | "detail">> = {
  app: { adresse: "/#comment", site: "principal", section: "comment" },
  lieux: { adresse: "/lieux", site: "principal" },
  actus: { adresse: "/actus", site: "principal" },
  bigSos: { adresse: "/#big-sos", site: "principal", section: "big-sos" },
  faq: { adresse: "/faq", site: "principal" },
  ambassadeurs: { adresse: "/programme", site: "ambassadeur" },
  pros: { adresse: "/bienvenue", site: "pro" },
  monCompte: { adresse: "/mon-compte", site: "principal" },
};

export type LiensEnTete = {
  liensBarre: LienEnTete[];
  groupesMenu: GroupeEnTete[];
  lienMonCompte: LienEnTete;
  lienPreviensMoi: { texte: string; adresse: string };
};

export function construireLiensEnTete(textes: TextesEnTete, langue: Langue): LiensEnTete {
  const lien = (cle: CleLien): LienEnTete => {
    const { adresse, ...reste } = ADRESSES[cle];
    return { ...textes.liens[cle], ...reste, adresse: ecrireCheminLangue(adresse, langue) };
  };
  return {
    liensBarre: [lien("app"), lien("lieux"), lien("actus"), lien("bigSos"), lien("ambassadeurs"), lien("pros")],
    groupesMenu: [
      { titre: textes.groupes.decouvrir, liens: [lien("app"), lien("lieux"), lien("actus"), lien("bigSos"), lien("faq")] },
      { titre: textes.groupes.rejoindre, liens: [lien("ambassadeurs"), lien("pros"), lien("monCompte")] },
    ],
    lienMonCompte: lien("monCompte"),
    lienPreviensMoi: { texte: textes.previensMoi, adresse: ecrireCheminLangue("/#inscription", langue) },
  };
}
