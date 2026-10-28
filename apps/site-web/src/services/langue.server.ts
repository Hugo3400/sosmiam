import type { Langue } from "../../../../packages/commun/src/regles/langues.ts";
import { choisirLanguePage, type LanguePage } from "~/fonctions/langue/choisir-langue-page";
import { listerLanguesServies } from "~/fonctions/langue/lister-langues-servies";
import { proposerLanguePage, type PropositionLangue } from "~/fonctions/langue/proposer-langue-page";

export type LangueRequete = LanguePage & { servies: readonly Langue[]; proposition: PropositionLangue };

export function lireLangueRequete(requete: Request): LangueRequete {
  const adresse = new URL(requete.url);
  const servies = listerLanguesServies(adresse.host);
  const demande = { adresse, cookie: requete.headers.get("cookie"), acceptLanguage: requete.headers.get("accept-language") };
  return { ...choisirLanguePage(demande, servies), servies, proposition: proposerLanguePage(demande, servies) };
}
