import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_DONNEES_SOCIALES_ANGLAIS } from "~/contenus/anglais/textes-donnees-sociales";

export const TEXTES_DONNEES_SOCIALES = {
  titrePartage: "Tes données sociales",
};

export const TEXTES_DONNEES_SOCIALES_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_DONNEES_SOCIALES>> = { fr: TEXTES_DONNEES_SOCIALES, en: TEXTES_DONNEES_SOCIALES_ANGLAIS };
