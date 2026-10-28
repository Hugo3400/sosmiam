import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ETIQUETTES_REGLEMENT_ANGLAIS } from "~/contenus/anglais/textes-etiquettes-reglement";

export const TEXTES_ETIQUETTES_REGLEMENT = {
  reduction: (pourcent: number) => ` −${pourcent} %`,
  glosePartenariat: "",
  glosePartenariatLue: "",
};

export const TEXTES_ETIQUETTES_REGLEMENT_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ETIQUETTES_REGLEMENT>> = {
  fr: TEXTES_ETIQUETTES_REGLEMENT,
  en: TEXTES_ETIQUETTES_REGLEMENT_ANGLAIS,
};
