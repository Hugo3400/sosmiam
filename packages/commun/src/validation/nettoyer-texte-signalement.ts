import { estTexteAffichable } from "./est-texte-affichable.ts";
import { nettoyerTexteSocial } from "./nettoyer-texte-social.ts";

const CONTROLES_SAUF_TABULATION_ET_RETOUR = /(?![\t\n])\p{Cc}/gu;

export function nettoyerTexteSignalement(brut: string): string {
  const propre = nettoyerTexteSocial(brut).replace(CONTROLES_SAUF_TABULATION_ET_RETOUR, "").trim();
  return estTexteAffichable(propre) ? propre : "";
}
