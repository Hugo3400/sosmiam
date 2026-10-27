import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_LIEU_PRO } from "~/contenus/lieu-pro";

export const TEXTES_LIEU_PRO_ANGLAIS: Traduction<typeof TEXTES_LIEU_PRO> = {
  statuts: {
    brouillon: "Your listing isn't published yet: the SOS Miam team will put it live soon. You can already get it ready.",
    masque: "Your listing is hidden for now. Drop us a line at bonjour@sosmiam.fr if you don't know why.",
  },
  voirFiche: "See my public listing",
};
