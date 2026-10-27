import { accorder } from "../../../../packages/commun/src/fonctions/langue/accorder.ts";
import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_CHAMP_VILLE_OU_REGION_ANGLAIS } from "~/contenus/anglais/champ-ville-ou-region";

export const TEXTES_CHAMP_VILLE_OU_REGION = {
  exemple: "Ta ville ou ta région",
  localiser: "Me localiser pour remplir ce champ",
  suggestions: "Villes et régions proposées",
  touteLaRegion: "toute la région",
  nombre: (nombre: number) => `${nombre} ${accorder(nombre, "fr", "suggestion", "suggestions")}`,
  aucune: "Aucune suggestion : tu peux garder ce que tu as tapé.",
};

export const TEXTES_CHAMP_VILLE_OU_REGION_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CHAMP_VILLE_OU_REGION>> = {
  fr: TEXTES_CHAMP_VILLE_OU_REGION,
  en: TEXTES_CHAMP_VILLE_OU_REGION_ANGLAIS,
};
