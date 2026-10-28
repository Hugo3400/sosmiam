import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_COMMUNAUTE_LOCALE_ANGLAIS } from "~/contenus/anglais/textes-communaute-locale";

export const TEXTES_COMMUNAUTE_LOCALE = {
  prenomParDefaut: "Toi",
};

export const TEXTES_COMMUNAUTE_LOCALE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_COMMUNAUTE_LOCALE>> = { fr: TEXTES_COMMUNAUTE_LOCALE, en: TEXTES_COMMUNAUTE_LOCALE_ANGLAIS };
