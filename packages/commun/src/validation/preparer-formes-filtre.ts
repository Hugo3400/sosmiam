import { EXPRESSIONS_PERMISES } from "../regles/mots-interdits";
import { construireMotifExpressions } from "./construire-motif-expressions";
import { simplifierTexteFiltre } from "./simplifier-texte-filtre";

const MOTIF_PERMIS = construireMotifExpressions(EXPRESSIONS_PERMISES, "g");
// Chiffres et symboles pris pour des lettres (« c0nn4rd », « s@lope ») ; le « 1 » vaut un « i » ou un « l », on essaie les deux
const LETTRES_DES_CHIFFRES: Record<string, string> = { "0": "o", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b" };
const LETTRES_DES_SYMBOLES: Record<string, string> = { "@": "a", $: "s", "€": "e" };

/** Mots séparés par une seule espace : tout ce qui n'est ni lettre ni chiffre sépare (« c.o.n », « pute_69 ») */
const separerMots = (texte: string) => texte.replace(/[^a-z0-9]+/g, " ").trim();

/** Lettres isolées recollées : « c o n n a r d » et « c.o.n.n.a.r.d » deviennent « connard » (« à 20 h » ne bouge pas) */
const recollerLettres = (mots: string) => mots.replace(/\b[a-z0-9](?: [a-z0-9])+\b/g, (suite) => suite.replace(/ /g, ""));

/**
 * Chiffres lus comme des lettres, seulement dans un mot qui a déjà au moins deux lettres (« c0nn4rd », « pu73 ») :
 * « 7g de sucre » ou « 20h30 » ne deviennent pas des mots.
 */
const lireChiffres = (mots: string, un: "i" | "l") =>
  mots
    .split(" ")
    .map((mot) =>
      /[0-9]/.test(mot) && (mot.match(/[a-z]/g)?.length ?? 0) >= 2
        ? mot.replace(/[0-9]/g, (chiffre) => (chiffre === "1" ? un : (LETTRES_DES_CHIFFRES[chiffre] ?? chiffre)))
        : mot,
    )
    .join(" ");

/** Chiffres et lettres décollés : « pute69 » → « pute 69 », « 13ntm » → « 13 ntm » */
const decollerChiffres = (mots: string) => mots.replace(/([a-z])(?=[0-9])|([0-9])(?=[a-z])/g, "$1$2 ");

/**
 * Les façons de lire un texte pour le filtre de mots interdits, chacune sous la forme « ␣mot␣mot␣ » : minuscules sans
 * accents, chiffres décollés des lettres, expressions permises (« pain bâtard ») retirées. En plus du texte tel quel :
 * symboles et chiffres lus comme des lettres, lettres isolées recollées, lettres répétées (3 fois ou plus) ramenées à
 * deux puis à une (« connnnard » → « connard », « puuuute » → « pute »). Un mot interdit dans l'une d'elles suffit.
 */
export function preparerFormesFiltre(texte: string): string[] {
  const simple = simplifierTexteFiltre(texte);
  const formes = new Set<string>();
  const brutes = new Set([separerMots(simple), separerMots(simple.replace(/[@$€]/g, (s) => LETTRES_DES_SYMBOLES[s] ?? s))]);
  for (const brute of brutes) {
    for (const recollee of new Set([brute, recollerLettres(brute)])) {
      for (const lue of new Set([recollee, lireChiffres(recollee, "i"), lireChiffres(recollee, "l")])) {
        for (const reduite of new Set([lue, lue.replace(/([a-z])\1{2,}/g, "$1$1"), lue.replace(/([a-z])\1{2,}/g, "$1")])) {
          formes.add(` ${decollerChiffres(reduite)} `.replace(MOTIF_PERMIS, " "));
        }
      }
    }
  }
  return [...formes];
}
