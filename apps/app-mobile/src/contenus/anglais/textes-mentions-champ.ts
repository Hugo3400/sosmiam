import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_MENTIONS_CHAMP } from "~/contenus/textes-mentions-champ";

export const TEXTES_MENTIONS_CHAMP_ANGLAIS: Traduction<typeof TEXTES_MENTIONS_CHAMP> = {
  suggestions: (nombre: number) => `${nombre} ${nombre === 1 ? "friend" : "friends"} to mention, just above the text box`,
};
