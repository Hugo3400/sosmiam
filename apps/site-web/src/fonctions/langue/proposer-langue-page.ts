import { LANGUE_PAR_DEFAUT, type Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { choisirLangueNavigateur } from "../../../../../packages/commun/src/fonctions/langue/choisir-langue-navigateur.ts";
import type { DemandeLangue } from "~/fonctions/langue/choisir-langue-page";
import { estPageDoublee } from "~/fonctions/langue/est-page-doublee";
import { lireCookieLangue } from "~/fonctions/langue/lire-cookie-langue";
import { lireLangueChemin } from "~/fonctions/langue/lire-langue-chemin";

export type PropositionLangue = { proposee: Langue | null; evaluee: boolean };

export function proposerLanguePage({ adresse, cookie, acceptLanguage }: DemandeLangue, servies: readonly Langue[]): PropositionLangue {
  const { langue: langueChemin, chemin } = lireLangueChemin(adresse.pathname);
  if (servies.length < 2 || !estPageDoublee(chemin)) return { proposee: null, evaluee: false };
  const langue = langueChemin ?? LANGUE_PAR_DEFAUT;
  const choisie = lireCookieLangue(cookie);
  const navigateur = choisirLangueNavigateur(acceptLanguage, servies);
  const voulue = choisie ?? (navigateur === LANGUE_PAR_DEFAUT ? null : navigateur);
  return { proposee: voulue && voulue !== langue && servies.includes(voulue) ? voulue : null, evaluee: true };
}
