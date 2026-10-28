import type { Langue } from "@sos-miam/commun/regles/langues";
import { formaterPrixLu } from "~/fonctions/prix/formater-prix-lu";

export function formaterPrixLuLangue(prix: number, langue: Langue): string {
  if (langue !== "en") return formaterPrixLu(prix);
  const centimes = Math.round(prix * 100);
  const euros = Math.trunc(centimes / 100);
  const reste = Math.abs(centimes % 100);
  if (euros === 0 && reste > 0) return `${reste} cent${reste === 1 ? "" : "s"}`;
  const mot = Math.abs(euros) === 1 ? "euro" : "euros";
  return reste === 0 ? `${euros} ${mot}` : `${euros} ${mot} ${reste}`;
}
