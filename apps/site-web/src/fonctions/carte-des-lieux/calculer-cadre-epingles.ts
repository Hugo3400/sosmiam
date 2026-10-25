import type { EpingleLieu } from "~/types/lieux";

export type Cadre = [[number, number], [number, number]];

export function calculerCadreEpingles(epingles: readonly Pick<EpingleLieu, "latitude" | "longitude">[]): Cadre | null {
  if (epingles.length === 0) return null;
  let [ouest, sud, est, nord] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const { latitude, longitude } of epingles) {
    ouest = Math.min(ouest, longitude);
    est = Math.max(est, longitude);
    sud = Math.min(sud, latitude);
    nord = Math.max(nord, latitude);
  }
  return [[ouest, sud], [est, nord]];
}
