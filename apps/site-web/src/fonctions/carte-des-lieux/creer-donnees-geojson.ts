import type { FeatureCollection, Point } from "geojson";

import type { CategorieLieu, EpingleLieu } from "~/types/lieux";

export type ProprietesEpingle = { id: number; nom: string; type: CategorieLieu; sos: boolean; lettre: string };

export function creerDonneesGeojson(
  epingles: readonly EpingleLieu[],
  lettres: Readonly<Record<CategorieLieu, string>>,
  seulementSos = false,
): FeatureCollection<Point, ProprietesEpingle> {
  return {
    type: "FeatureCollection",
    features: epingles
      .filter((epingle) => !seulementSos || epingle.sos)
      .map(({ id, nom, type, sos, latitude, longitude }) => ({
        type: "Feature",
        id,
        geometry: { type: "Point", coordinates: [longitude, latitude] },
        properties: { id, nom, type, sos, lettre: lettres[type] },
      })),
  };
}
