import { accorder } from "../../../../../packages/commun/src/fonctions/langue/accorder.ts";
import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_CARTE_LIEU } from "~/contenus/carte-lieu";

export const TEXTES_CARTE_LIEU_ANGLAIS: Traduction<typeof TEXTES_CARTE_LIEU> = {
  sos: (places: number) => `SOS tonight · ${places} ${accorder(places, "en", "seat", "seats")}`,
  verifie: "✓ Verified",
  nonVerifie: "Not verified",
  denichePar: (prenom: string) => `Spotted by ${prenom}`,
};
