import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { TEXTES_POIDS_FICHIER_PAR_LANGUE } from "~/contenus/poids-fichier";

export function ecrirePoidsFichier(octets: number, langue: Langue, espace = " "): string {
  const T = choisirTextes(TEXTES_POIDS_FICHIER_PAR_LANGUE, langue);
  if (octets < 1_000_000) return `${Math.max(1, Math.round(octets / 1000))}${espace}${T.kilo}`;
  return `${new Intl.NumberFormat(T.format, { maximumFractionDigits: 1 }).format(octets / 1_000_000)}${espace}${T.mega}`;
}
