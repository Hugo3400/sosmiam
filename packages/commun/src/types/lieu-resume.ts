// Le strict nécessaire d'un lieu, recopié dans une visite, une carte de fidélité, une réservation ou un avis à relire.

import type { TypeLieu } from "./lieu.ts";

/** Ce qu'il faut d'un lieu pour afficher une visite, une carte de fidélité ou une réservation */
export type LieuResume = { id: number; nom: string; emoji: string; type: TypeLieu; ville: string };
