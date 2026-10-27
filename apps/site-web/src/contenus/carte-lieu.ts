import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_CARTE_LIEU_ANGLAIS } from "~/contenus/anglais/carte-lieu";

export const TEXTES_CARTE_LIEU = {
  sos: (places: number) => `SOS ce soir · ${places} ${places > 1 ? "places" : "place"}`,
  verifie: "✓ Vérifié",
  nonVerifie: "Non vérifié",
  denichePar: (prenom: string) => `Déniché par ${prenom}`,
} as const;

export const TEXTES_CARTE_LIEU_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CARTE_LIEU>> = {
  fr: TEXTES_CARTE_LIEU,
  en: TEXTES_CARTE_LIEU_ANGLAIS,
};
