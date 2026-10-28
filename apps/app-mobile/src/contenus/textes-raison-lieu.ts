import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_RAISON_LIEU_ANGLAIS } from "~/contenus/anglais/textes-raison-lieu";

export const TEXTES_RAISON_LIEU = {
  parceQueTuAimes: (type: string) => `Parce que tu aimes ${type}`,
  petitPrix: "Petit prix, grand plaisir",
  aDeuxPas: "À deux pas de chez toi",
};

export const TEXTES_RAISON_LIEU_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_RAISON_LIEU>> = { fr: TEXTES_RAISON_LIEU, en: TEXTES_RAISON_LIEU_ANGLAIS };
