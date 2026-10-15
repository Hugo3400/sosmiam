import { formaterDistance } from "~/fonctions/geo/formater-distance";

export function ecrireDistanceDepuis(km: number, depuis: string | null): string {
  return depuis ? `${formaterDistance(km)} ${depuis}` : formaterDistance(km);
}
