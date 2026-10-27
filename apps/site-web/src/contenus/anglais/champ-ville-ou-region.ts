import { accorder } from "../../../../../packages/commun/src/fonctions/langue/accorder.ts";
import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_CHAMP_VILLE_OU_REGION } from "~/contenus/champ-ville-ou-region";

export const TEXTES_CHAMP_VILLE_OU_REGION_ANGLAIS: Traduction<typeof TEXTES_CHAMP_VILLE_OU_REGION> = {
  exemple: "Your city or region",
  localiser: "Use my location to fill in this field",
  suggestions: "Suggested cities and regions",
  touteLaRegion: "the whole region",
  nombre: (nombre: number) => `${nombre} ${accorder(nombre, "en", "suggestion", "suggestions")}`,
  aucune: "No suggestions – you can keep what you've typed.",
};
