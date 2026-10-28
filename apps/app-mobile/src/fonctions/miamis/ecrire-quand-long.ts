import type { Langue } from "@sos-miam/commun/regles/langues";
import { ecrireHeureLangue } from "~/fonctions/langue/ecrire-heure-langue";
import { ecrireJourLongLangue } from "~/fonctions/langue/ecrire-jour-long-langue";

export function ecrireQuandLong(iso: string, langue: Langue, maintenant: Date = new Date()): string {
  return `${ecrireJourLongLangue(iso, langue, maintenant)} · ${ecrireHeureLangue(iso, langue)}`;
}
