import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_EN_TETE_MODE } from "~/contenus/textes-modes";

export const TEXTES_EN_TETE_MODE_ANGLAIS: Traduction<typeof TEXTES_EN_TETE_MODE> = {
  pastilles: { pro: "Pro mode", ambassadeur: "Ambassador mode" },
  revenir: "Back to my SOS Miam",
  indiceRevenir: (pastille: string) => `Leaves ${pastille} and takes you back to your profile`,
};
