import type { PositionLieu } from "@sos-miam/commun/types/lieu";

export function calculerCoinsAutour(points: PositionLieu[], demiMin: number): [PositionLieu, PositionLieu] {
  const latitudes = points.map((p) => p.latitude);
  const longitudes = points.map((p) => p.longitude);
  const centre = {
    latitude: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
    longitude: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
  };
  const demiLatitude = Math.max((Math.max(...latitudes) - Math.min(...latitudes)) / 2, demiMin);
  const demiLongitude = Math.max((Math.max(...longitudes) - Math.min(...longitudes)) / 2, demiMin / Math.cos((centre.latitude * Math.PI) / 180));
  return [
    { latitude: centre.latitude + demiLatitude, longitude: centre.longitude - demiLongitude },
    { latitude: centre.latitude - demiLatitude, longitude: centre.longitude + demiLongitude },
  ];
}
