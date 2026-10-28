import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ETIQUETTES_REGLEMENT } from "~/contenus/textes-etiquettes-reglement";

export const TEXTES_ETIQUETTES_REGLEMENT_ANGLAIS: Traduction<typeof TEXTES_ETIQUETTES_REGLEMENT> = {
  reduction: (pourcent: number) => ` −${pourcent}%`,
  glosePartenariat: " · paid or gifted partnership",
  glosePartenariatLue: ": a paid or gifted partnership",
};
