import type { ZoneGeo } from "@sos-miam/commun/contenus/regions-france";

/** Un bord posé sur la grille : à la case du dessous (sud, ouest) ou du dessus (nord, est), sans poussière de virgule */
function poser(valeur: number, pas: number, versLeHaut: boolean): number {
  const cases = versLeHaut ? Math.ceil(valeur / pas) : Math.floor(valeur / pas);
  return Number((cases * pas).toFixed(6));
}

/**
 * La zone envoyée au serveur pour lire des lieux : agrandie vers l'extérieur jusqu'aux bords d'une grille fixe, des
 * multiples de « pas » degrés (0,5 : environ 55 km du nord au sud, 40 km d'ouest en est en France). Le nord monte, le sud
 * descend, l'ouest part à gauche, l'est à droite : la zone arrondie contient toujours la zone demandée, et le serveur ne
 * voit que des cases, jamais un point précis. Une zone déjà sur la grille ne bouge pas.
 */
export function arrondirZoneALaGrille(zone: ZoneGeo, pas = 0.5): ZoneGeo {
  return {
    nord: Math.min(90, poser(zone.nord, pas, true)),
    sud: Math.max(-90, poser(zone.sud, pas, false)),
    ouest: Math.max(-180, poser(zone.ouest, pas, false)),
    est: Math.min(180, poser(zone.est, pas, true)),
  };
}
