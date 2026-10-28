import type { Langue } from "@sos-miam/commun/regles/langues";
import { decrireFinLimitation } from "~/fonctions/compte/decrire-fin-limitation";
import { ecrireMomentLongLangue } from "~/fonctions/langue/ecrire-moment-long-langue";

export function decrireFinLimitationLangue(fin: string | null | undefined, langue: Langue): string {
  if (langue !== "en") return decrireFinLimitation(fin);
  const moment = ecrireMomentLongLangue(fin, langue);
  return moment ? `until ${moment}` : "until further notice";
}
