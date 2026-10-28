import type { Langue } from "@sos-miam/commun/regles/langues";
import { formaterDistance } from "~/fonctions/geo/formater-distance";

export function formaterDistanceLangue(km: number, langue: Langue): string {
  const distance = formaterDistance(km);
  return langue === "en" ? distance.replace(",", ".") : distance;
}
