import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { libelleParEnvie, libelleParType } from "~/contenus/correspondances-envies";

export const LIBELLE_PAR_TYPE_ANGLAIS: Traduction<typeof libelleParType> = {
  resto: "restaurants",
  patisserie: "patisseries",
  bar: "bars",
  sortie: "a good day out",
};

export const LIBELLE_PAR_ENVIE_ANGLAIS: Traduction<typeof libelleParEnvie> = {
  terrasse: "A sunny terrace",
  vege: "A veggie option for you",
  amoureux: "Perfect for couples",
  potes: "Perfect with friends",
  famille: "Perfect for families",
};
