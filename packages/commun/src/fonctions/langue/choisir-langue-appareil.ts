import { LANGUE_PAR_DEFAUT, type Langue } from "../../regles/langues.ts";
import { lireLangue } from "./lire-langue.ts";

export function choisirLangueAppareil(codes: readonly string[], ouvertes: readonly Langue[]): Langue {
  for (const code of codes) {
    const langue = lireLangue(code);
    if (langue && ouvertes.includes(langue)) return langue;
  }
  return LANGUE_PAR_DEFAUT;
}
