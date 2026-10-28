import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ETOILES_AVIS_ANGLAIS } from "~/contenus/anglais/textes-etoiles-avis";

export const TEXTES_ETOILES_AVIS = {
  choixLu: (note: number, libelle: string) => `${note} étoile${note > 1 ? "s" : ""} sur 5 : ${libelle}`,
  noteLue: (note: number) => `Note : ${note} sur 5`,
};

export const TEXTES_ETOILES_AVIS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ETOILES_AVIS>> = { fr: TEXTES_ETOILES_AVIS, en: TEXTES_ETOILES_AVIS_ANGLAIS };
