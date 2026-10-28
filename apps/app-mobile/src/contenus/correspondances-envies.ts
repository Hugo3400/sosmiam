// Comment les envies de l'inscription se rapprochent des lieux (tri du fil « Pour toi » et « Parce que tu aimes… »).
import type { EnvieLieu, TypeLieu } from "@sos-miam/commun/types/lieu";
import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { LIBELLE_PAR_ENVIE_ANGLAIS, LIBELLE_PAR_TYPE_ANGLAIS } from "~/contenus/anglais/correspondances-envies";

/** Choix de la catégorie « lieux » → type de lieu */
export const typeParChoixLieu: Record<string, TypeLieu> = {
  restos: "resto",
  patisseries: "patisserie",
  bars: "bar",
  glaciers: "patisserie",
  "food-trucks": "resto",
  "salons-de-the": "patisserie",
  halles: "resto",
  caves: "bar",
  plages: "resto",
  cinemas: "sortie",
  concerts: "sortie",
  spectacles: "sortie",
  musees: "sortie",
  bowlings: "sortie",
  "escape-games": "sortie",
  ateliers: "sortie",
  "loisirs-sportifs": "sortie",
  nature: "sortie",
  "balades-mer": "sortie",
  domaines: "sortie",
};

/** Choix des catégories « moments » et « regimes » → ambiance du lieu */
export const envieParChoix: Record<string, EnvieLieu> = {
  amoureux: "amoureux",
  potes: "potes",
  famille: "famille",
  festif: "potes",
  vegetarien: "vege",
  vegan: "vege",
  "en-terrasse": "terrasse",
  "premier-rendez-vous": "amoureux",
  "avec-les-enfants": "famille",
  "grande-tablee": "potes",
  "coucher-de-soleil": "terrasse",
  flexitarien: "vege",
  pescetarien: "vege",
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

export const LIBELLE_PAR_TYPE_PAR_LANGUE: ParLangue<Traduction<typeof libelleParType>> = { fr: libelleParType, en: LIBELLE_PAR_TYPE_ANGLAIS };

export const LIBELLE_PAR_ENVIE_PAR_LANGUE: ParLangue<Traduction<typeof libelleParEnvie>> = { fr: libelleParEnvie, en: LIBELLE_PAR_ENVIE_ANGLAIS };
