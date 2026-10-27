import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_ILS_ONT_BESOIN_DE_TOI } from "~/contenus/ils-ont-besoin-de-toi";

const nombreAnglais = new Intl.NumberFormat("en-GB");

export const TEXTES_ILS_ONT_BESOIN_DE_TOI_ANGLAIS: Traduction<typeof TEXTES_ILS_ONT_BESOIN_DE_TOI> = {
  titre: "They'd love to see you",
  chapo: "New places, or quiet ones, that deserve a fuller room.",
  filtres: "Filter places",
  tout: "All",
  voirTous: (nombre: number | null) => (nombre && nombre > 1 ? `See all ${nombreAnglais.format(nombre)} places on the map` : "See all places"),
  tirage: "8 places picked at random every day – the ones with an SOS tonight come first. All the others are waiting for you on the map.",
};
