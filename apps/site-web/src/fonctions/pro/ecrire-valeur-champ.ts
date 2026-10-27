import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { LANGUE_PAR_DEFAUT, type Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { TEXTES_FICHE_PRO_PAR_LANGUE } from "~/contenus/fiche-pro";
import { TEXTES_INFOS_PRATIQUES_PAR_LANGUE } from "~/contenus/infos-pratiques";

/**
 * Une valeur d'un champ de fiche, en mots, pour les suggestions (« avant → après ») : vide → « (rien) », oui / non, les
 * libellés des animaux, de la réservation et des paiements ; le reste tel quel.
 */
export function ecrireValeurChamp(champ: string, valeur: unknown, langue: Langue = LANGUE_PAR_DEFAUT): string {
  const T = choisirTextes(TEXTES_FICHE_PRO_PAR_LANGUE, langue).valeurs;
  const I = choisirTextes(TEXTES_INFOS_PRATIQUES_PAR_LANGUE, langue);
  if (valeur === null || valeur === undefined || valeur === "" || (Array.isArray(valeur) && valeur.length === 0)) return T.rien;
  if (typeof valeur === "boolean") return valeur ? T.oui : T.non;
  if (champ === "animaux" && typeof valeur === "string") return (Object.hasOwn(I.animaux, valeur) ? I.animaux[valeur as keyof typeof I.animaux] : undefined) ?? valeur;
  if (champ === "reservation" && typeof valeur === "string") return (Object.hasOwn(I.reservation, valeur) ? I.reservation[valeur as keyof typeof I.reservation] : undefined) ?? valeur;
  if (Array.isArray(valeur)) return valeur.map((code) => (Object.hasOwn(I.paiement, String(code)) ? I.paiement[code as keyof typeof I.paiement] : undefined) ?? String(code)).join(", ");
  return String(valeur);
}
