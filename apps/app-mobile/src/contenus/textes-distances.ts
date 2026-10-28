import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_DISTANCES_ANGLAIS } from "~/contenus/anglais/textes-distances";

export const TEXTES_DISTANCES = {
  depuisToi: "de toi",
};

export const TEXTES_DISTANCES_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_DISTANCES>> = { fr: TEXTES_DISTANCES, en: TEXTES_DISTANCES_ANGLAIS };
