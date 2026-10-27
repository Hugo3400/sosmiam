import { LANGUE_PAR_DEFAUT, PARAMETRE_LANGUE, type Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { choisirLangueNavigateur } from "../../../../../packages/commun/src/fonctions/langue/choisir-langue-navigateur.ts";
import { lireLangue } from "../../../../../packages/commun/src/fonctions/langue/lire-langue.ts";
import { estPageDoublee } from "~/fonctions/langue/est-page-doublee";
import { lireCookieLangue } from "~/fonctions/langue/lire-cookie-langue";
import { lireLangueChemin } from "~/fonctions/langue/lire-langue-chemin";

export type DemandeLangue = { adresse: URL; cookie: string | null; acceptLanguage: string | null };

export type LanguePage = { langue: Langue; servie: boolean; negociee: boolean };

export function choisirLanguePage({ adresse, cookie, acceptLanguage }: DemandeLangue, servies: readonly Langue[]): LanguePage {
  const { langue: langueChemin, chemin } = lireLangueChemin(adresse.pathname);
  if (langueChemin) return { langue: langueChemin, servie: servies.includes(langueChemin), negociee: false };
  if (estPageDoublee(chemin) || servies.length < 2) return { langue: LANGUE_PAR_DEFAUT, servie: true, negociee: false };
  const demandee = lireLangue(adresse.searchParams.get(PARAMETRE_LANGUE)) ?? lireCookieLangue(cookie);
  const langue = demandee && servies.includes(demandee) ? demandee : choisirLangueNavigateur(acceptLanguage, servies);
  return { langue, servie: true, negociee: true };
}
