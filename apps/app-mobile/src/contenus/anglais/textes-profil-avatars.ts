import type { IdMiamiAuChoix } from "@sos-miam/commun/regles/avatars-miamis";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_GRILLE_MIAMIS } from "~/contenus/textes-profil-avatars";

export const TEXTES_GRILLE_MIAMIS_ANGLAIS: Traduction<typeof TEXTES_GRILLE_MIAMIS> = {
  groupeLu: "Pick one of the Miamis",
  miamiLu: (nom: string, position: number, total: number) => `${nom}, ${position} of ${total}`,
  miamiCourtLu: (nom: string) => nom,
};

export const NOMS_MIAMIS_ANGLAIS: Readonly<Partial<Record<IdMiamiAuChoix, string>>> = {
  platine: "DJ",
  solaire: "Shades",
  bob: "Bucket",
  binocles: "Specs",
  tuba: "Snorkel",
};
