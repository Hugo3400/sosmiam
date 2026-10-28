import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ECRAN_REGLAGE_ANGLAIS } from "~/contenus/anglais/textes-ecran-reglage";

export const TEXTES_ECRAN_REGLAGE = {
  retour: "Retour",
} as const;

export const TEXTES_ECRAN_REGLAGE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ECRAN_REGLAGE>> = { fr: TEXTES_ECRAN_REGLAGE, en: TEXTES_ECRAN_REGLAGE_ANGLAIS };
