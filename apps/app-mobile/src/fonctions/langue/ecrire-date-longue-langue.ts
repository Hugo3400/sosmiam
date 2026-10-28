import { ecrireDateLangue } from "@sos-miam/commun/fonctions/langue/ecrire-date-langue";
import type { Langue } from "@sos-miam/commun/regles/langues";

export function ecrireDateLongueLangue(dateIso: string, langue: Langue): string {
  const [annee, mois, jour] = dateIso.split("-").map(Number);
  return ecrireDateLangue({ annee, mois, jour }, langue);
}
