// Comment les envies de l'inscription se rapprochent des lieux (tri du fil « Pour toi » et « Parce que tu aimes… »).
import type { EnvieLieu, TypeLieu } from "@sos-miam/commun/types/lieu";

/** Choix de la catégorie « lieux » → type de lieu */
export const typeParChoixLieu: Record<string, TypeLieu> = {
  restos: "resto",
  patisseries: "patisserie",
  bars: "bar",
  caves: "bar",
  bowlings: "sortie",
  "escape-games": "sortie",
  ateliers: "sortie",
  nature: "sortie",
  concerts: "sortie",
};

/** Choix des catégories « moments » et « regimes » → ambiance du lieu */
export const envieParChoix: Record<string, EnvieLieu> = {
  amoureux: "amoureux",
  potes: "potes",
  famille: "famille",
  festif: "potes",
  vegetarien: "vege",
  vegan: "vege",
};

export const libelleParType: Record<TypeLieu, string> = {
  resto: "les restos",
  patisserie: "les pâtisseries",
  bar: "les bars",
  sortie: "les sorties",
};

export const libelleParEnvie: Record<EnvieLieu, string> = {
  terrasse: "Terrasse au soleil",
  vege: "Option végé pour toi",
  amoureux: "Parfait en amoureux",
  potes: "Parfait entre potes",
  famille: "Parfait en famille",
};
