import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { ecrireCheminLangue } from "~/fonctions/langue/ecrire-chemin-langue";
import { listerLanguesServies } from "~/fonctions/langue/lister-langues-servies";

export function ecrireAdresseLangue(adresse: string, langue: Langue): string {
  if (adresse.startsWith("/")) return ecrireCheminLangue(adresse, langue);
  let url: URL;
  try {
    url = new URL(adresse);
  } catch {
    return adresse;
  }
  const hote = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || (hote !== "sosmiam.fr" && !hote.endsWith(".sosmiam.fr"))) return adresse;
  if (!listerLanguesServies(hote).includes(langue)) return adresse;
  const chemin = ecrireCheminLangue(`${url.pathname}${url.search}${url.hash}`, langue);
  return `${url.origin}${chemin}`;
}
