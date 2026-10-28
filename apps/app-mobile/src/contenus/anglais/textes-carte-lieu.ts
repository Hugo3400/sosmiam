import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_CARTE_LIEU } from "~/contenus/textes-carte-lieu";

export const TEXTES_CARTE_LIEU_ANGLAIS: Traduction<typeof TEXTES_CARTE_LIEU> = {
  carte: "The menu",
  formules: "Packages",
  pasEncoreCarte: "No menu here yet",
  pasEncoreFormules: "No packages here yet",
  pasEncoreTexte: (nom: string, formules: boolean) =>
    `${nom} hasn't put ${formules ? "their packages" : "their menu"} in the app yet. Ask when you're there – they'll tell you everything!`,
  seulementCeQuiMeVa: "Only what suits me",
  gardes: (gardes: number, total: number, regimes: string) => `${gardes} of ${total} ${gardes === 1 ? "suits" : "suit"} you, going by what the place has marked (${regimes})`,
  reperes: (regimes: string) => `Going by what the place has marked (${regimes})`,
  rienIndique: (regimes: string) => `Nothing on this menu is marked ${regimes} yet. Ask when you're there – they can sometimes adapt a dish!`,
  toutAfficher: "Show everything",
  prixIndicatifs: "Prices are a guide only: the menu can change and the place always has the final say. An allergy? Always mention it when you're there.",
  miseAJour: (date: string) => `Updated by the venue on ${date}`,
  apercu: {
    signatures: "What they do best",
    avantGout: "A little taster",
    voirTout: (formules: boolean, nombre: number) => `${formules ? "See all packages" : "See the full menu"} (${nombre})`,
    voirToutIndice: (formules: boolean, deLieu: string) => `Opens ${formules ? "all the packages" : "the full menu"} ${deLieu}, sorted by section`,
  },
  element: {
    specialite: "house favourite",
    gratuitLu: "free",
    gratuit: "Free",
    signature: "⭐ House favourite",
  },
  sectionLu: (titre: string, position: number, total: number) => `${titre}, section ${position} of ${total}`,
  sectionIndice: "Scrolls the menu to this section",
};
