import type { Langue } from "@sos-miam/commun/regles/langues";
import { listerPrenoms } from "~/fonctions/texte/lister-prenoms";

export function listerPrenomsLangue(prenoms: string[], langue: Langue): string {
  if (langue !== "en") return listerPrenoms(prenoms);
  if (prenoms.length <= 1) return prenoms[0] ?? "";
  return `${prenoms.slice(0, -1).join(", ")} and ${prenoms[prenoms.length - 1]}`;
}
