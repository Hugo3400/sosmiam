import type { EtiquetteCarte } from "@sos-miam/commun/types/carte";
import type { ParLangue } from "@sos-miam/commun/types/traduction";
import { LIBELLES_REGIMES_CARTE_ANGLAIS } from "~/contenus/anglais/regimes-carte";

/**
 * Régimes du profil (choix « regimes » de l'inscription) que la carte sait reconnaître, et les repères qui les
 * satisfont : un plat vegan convient aussi à qui est végétarien. Les autres régimes (halal, sans lactose…) ne sont pas
 * encore indiqués par les lieux : ils ne filtrent rien.
 */
export const regimesCarte: Partial<Record<string, { libelle: string; etiquettes: EtiquetteCarte[] }>> = {
  vegetarien: { libelle: "végétarien", etiquettes: ["vege", "vegan"] },
  vegan: { libelle: "vegan", etiquettes: ["vegan"] },
  "sans-gluten": { libelle: "sans gluten", etiquettes: ["sans-gluten"] },
};

export const LIBELLES_REGIMES_CARTE_PAR_LANGUE: ParLangue<Readonly<Record<string, string>>> = {
  fr: Object.fromEntries(Object.entries(regimesCarte).flatMap(([regime, carte]): [string, string][] => (carte ? [[regime, carte.libelle]] : []))),
  en: LIBELLES_REGIMES_CARTE_ANGLAIS,
};
