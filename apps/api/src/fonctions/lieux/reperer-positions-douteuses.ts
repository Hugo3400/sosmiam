import { calculerDistanceMetres } from "../../../../../packages/commun/src/fonctions/geo/calculer-distance-metres.ts";
import { normaliserNomCommune } from "../geo/normaliser-nom-commune.ts";

export type LieuPositionne = { id: number; ville: string; latitude: number | null; longitude: number | null };

/** Au-delà, un lieu est loin des autres lieux de sa ville : sa position est sans doute fausse (ou sa ville) */
export const ECART_DOUTEUX_KM = 10;

const mediane = (valeurs: number[]) => {
  const triees = [...valeurs].sort((a, b) => a - b);
  const milieu = Math.floor(triees.length / 2);
  return triees.length % 2 ? triees[milieu]! : (triees[milieu - 1]! + triees[milieu]!) / 2;
};

/**
 * Les lieux dont la position est douteuse : à plus de 10 km du centre des lieux de leur ville (médiane, pour qu'une
 * erreur ne déplace pas le centre ; il faut au moins 3 lieux placés dans la ville), ou posés en (0, 0). Du plus loin au
 * plus proche, avec la distance en kilomètres.
 */
export function repererPositionsDouteuses(lieux: LieuPositionne[]): { id: number; distanceKm: number | null }[] {
  const douteux: { id: number; distanceKm: number | null }[] = [];
  const parVille = new Map<string, { id: number; latitude: number; longitude: number }[]>();
  for (const lieu of lieux) {
    if (lieu.latitude === null || lieu.longitude === null) continue;
    if (lieu.latitude === 0 && lieu.longitude === 0) {
      douteux.push({ id: lieu.id, distanceKm: null });
      continue;
    }
    const cle = normaliserNomCommune(lieu.ville);
    parVille.set(cle, [...(parVille.get(cle) ?? []), { id: lieu.id, latitude: lieu.latitude, longitude: lieu.longitude }]);
  }
  for (const places of parVille.values()) {
    if (places.length < 3) continue;
    const centre = { latitude: mediane(places.map((p) => p.latitude)), longitude: mediane(places.map((p) => p.longitude)) };
    for (const place of places) {
      const distanceKm = calculerDistanceMetres(centre, place) / 1000;
      if (distanceKm > ECART_DOUTEUX_KM) douteux.push({ id: place.id, distanceKm: Math.round(distanceKm * 10) / 10 });
    }
  }
  return douteux.sort((a, b) => (b.distanceKm ?? Infinity) - (a.distanceKm ?? Infinity));
}
