import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_RAISON_LIEU } from "~/contenus/textes-raison-lieu";

export const TEXTES_RAISON_LIEU_ANGLAIS: Traduction<typeof TEXTES_RAISON_LIEU> = {
  parceQueTuAimes: (type: string) => `Because you love ${type}`,
  petitPrix: "Small price, big treat",
  aDeuxPas: "Just round the corner from you",
};
