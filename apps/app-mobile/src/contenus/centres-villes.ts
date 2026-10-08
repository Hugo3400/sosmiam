import type { PositionLieu } from "@sos-miam/commun/types/lieu";

/** Centre des villes de lancement, pour cadrer la carte d'Explorer sur la ville de la personne. */
export const centresVilles: Record<string, PositionLieu> = {
  Montpellier: { latitude: 43.6108, longitude: 3.8767 },
  Sète: { latitude: 43.4028, longitude: 3.6928 },
  Béziers: { latitude: 43.3442, longitude: 3.2158 },
  Pézenas: { latitude: 43.459, longitude: 3.423 },
  Agde: { latitude: 43.3108, longitude: 3.4758 },
  Lunel: { latitude: 43.675, longitude: 4.136 },
  Lodève: { latitude: 43.7317, longitude: 3.3194 },
  "Palavas-les-Flots": { latitude: 43.5283, longitude: 3.93 },
};

/** Tout l'Hérault de nos lieux, quand la ville de la personne n'est pas une ville de lancement */
export const centreHerault: PositionLieu = { latitude: 43.55, longitude: 3.65 };
