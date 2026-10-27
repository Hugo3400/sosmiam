import type { Langue } from "../../../../packages/commun/src/regles/langues.ts";
import { choisirLanguePage, type LanguePage } from "~/fonctions/langue/choisir-langue-page";
import { listerLanguesServies } from "~/fonctions/langue/lister-langues-servies";

export type LangueRequete = LanguePage & { servies: readonly Langue[] };

export function lireLangueRequete(requete: Request): LangueRequete {
  const adresse = new URL(requete.url);
  const servies = listerLanguesServies(adresse.host);
  const page = choisirLanguePage({ adresse, cookie: requete.headers.get("cookie"), acceptLanguage: requete.headers.get("accept-language") }, servies);
  return { ...page, servies };
}
