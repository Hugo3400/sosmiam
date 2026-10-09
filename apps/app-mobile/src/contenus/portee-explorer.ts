import type { PositionLieu } from "@sos-miam/commun/types/lieu";

/** Jusqu'où regarde Explorer (carte et liste) : à quelques kilomètres, ta région, ou toute la France */
export type PorteeExplorer = "proche" | "region" | "france";

/** « À quelques kilomètres » : rayon réglable au curseur, retenu sur le téléphone (décidé avec Hugo le 9 octobre 2026) */
export const RAYON_PROCHE_KM = { min: 1, max: 50, defaut: 5 } as const;

/** La zone regardée, avec ce qu'il faut pour savoir si un lieu en fait partie */
export type ZonePortee =
  | { portee: "proche"; /** Ta position (« Autour de moi »), sinon le centre de ta ville ; null si on ne connaît ni l'un ni l'autre */ centre: PositionLieu | null; rayonKm: number }
  | { portee: "region"; /** null si on ne sait pas dans quelle région tu es */ region: string | null }
  | { portee: "france" };
