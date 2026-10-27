import { COOKIE_LANGUE, type Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { lireLangue } from "../../../../../packages/commun/src/fonctions/langue/lire-langue.ts";

export function lireCookieLangue(enTeteCookie: string | null): Langue | null {
  if (!enTeteCookie) return null;
  for (const morceau of enTeteCookie.split(";")) {
    const egal = morceau.indexOf("=");
    if (egal !== -1 && morceau.slice(0, egal).trim() === COOKIE_LANGUE) return lireLangue(morceau.slice(egal + 1).trim());
  }
  return null;
}
