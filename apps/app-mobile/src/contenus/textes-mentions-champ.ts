import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_MENTIONS_CHAMP_ANGLAIS } from "~/contenus/anglais/textes-mentions-champ";

export const TEXTES_MENTIONS_CHAMP = {
  suggestions: (nombre: number) => `${nombre} pote${nombre > 1 ? "s" : ""} à mentionner, juste au-dessus du champ`,
};

export const TEXTES_MENTIONS_CHAMP_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_MENTIONS_CHAMP>> = { fr: TEXTES_MENTIONS_CHAMP, en: TEXTES_MENTIONS_CHAMP_ANGLAIS };
