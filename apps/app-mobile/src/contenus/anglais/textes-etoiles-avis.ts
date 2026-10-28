import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ETOILES_AVIS } from "~/contenus/textes-etoiles-avis";

export const TEXTES_ETOILES_AVIS_ANGLAIS: Traduction<typeof TEXTES_ETOILES_AVIS> = {
  choixLu: (note: number, libelle: string) => `${note} star${note === 1 ? "" : "s"} out of 5: ${libelle}`,
  noteLue: (note: number) => `Rated ${note} out of 5`,
};
