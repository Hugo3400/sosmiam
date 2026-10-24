import { LANGUE_PAR_DEFAUT, type Langue } from "../../regles/langues.ts";
import { lireLangue } from "./lire-langue.ts";

const LONGUEUR_MAX = 1000;
const ENTREE = /^([a-z]{1,8}(?:[-_][a-z0-9]{1,8})*|\*)(?:\s*;\s*q\s*=\s*(0(?:\.\d{0,3})?|1(?:\.0{0,3})?))?$/i;

export function choisirLangueNavigateur(acceptLanguage: string | null | undefined, ouvertes: readonly Langue[]): Langue {
  if (!acceptLanguage || acceptLanguage.length > LONGUEUR_MAX) return LANGUE_PAR_DEFAUT;
  const voeux: { langue: Langue | null; q: number }[] = [];
  for (const brut of acceptLanguage.split(",")) {
    const entree = brut.trim();
    if (!entree) continue;
    const morceaux = ENTREE.exec(entree);
    if (!morceaux) return LANGUE_PAR_DEFAUT;
    const q = morceaux[2] === undefined ? 1 : Number(morceaux[2]);
    if (morceaux[1] !== "*" && q > 0) voeux.push({ langue: lireLangue(morceaux[1]), q });
  }
  voeux.sort((a, b) => b.q - a.q);
  for (const { langue } of voeux) if (langue && ouvertes.includes(langue)) return langue;
  return LANGUE_PAR_DEFAUT;
}
