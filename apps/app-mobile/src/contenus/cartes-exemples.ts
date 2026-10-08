import type { CarteLieu } from "@sos-miam/commun/types/carte";

import { cartesHerault } from "~/contenus/cartes/cartes-herault";
import { cartesMontpellier } from "~/contenus/cartes/cartes-montpellier";

/**
 * Cartes des lieux d'exemple (identifiant du lieu → sa carte), en attendant que les lieux la remplissent eux-mêmes via l'API.
 * Le plat signature de chaque lieu (lieux-exemples.ts, champ « plat ») y figure avec le même prix.
 */
export const cartesExemples: Partial<Record<number, CarteLieu>> = { ...cartesMontpellier, ...cartesHerault };
