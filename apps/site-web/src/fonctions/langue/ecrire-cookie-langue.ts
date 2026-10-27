import { COOKIE_LANGUE, type Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { HOTE_AMBASSADEUR, HOTE_PRO } from "~/fonctions/hotes/choisir-redirection-hote";

const DOMAINE = "sosmiam.fr";
const UN_AN_SECONDES = 365 * 24 * 3600;

export function ecrireCookieLangue(langue: Langue, hote: string): string {
  const nomHote = hote.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  const partage = [DOMAINE, HOTE_AMBASSADEUR, HOTE_PRO].includes(nomHote);
  const securise = nomHote === DOMAINE || nomHote.endsWith(`.${DOMAINE}`);
  return [
    `${COOKIE_LANGUE}=${langue}`,
    `Max-Age=${UN_AN_SECONDES}`,
    "Path=/",
    ...(partage ? [`Domain=${DOMAINE}`] : []),
    "SameSite=Lax",
    ...(securise ? ["Secure"] : []),
  ].join("; ");
}
