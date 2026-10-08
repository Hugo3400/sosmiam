import { FORME_PSEUDO } from "../regles/potes";

/** Vrai si le pseudo a la bonne forme (3 à 20 caractères : minuscules, chiffres, point, tiret bas). L'unicité se vérifiera avec l'API. */
export function estPseudoValide(pseudo: unknown): pseudo is string {
  return typeof pseudo === "string" && FORME_PSEUDO.test(pseudo) && !pseudo.includes("..") && !pseudo.includes("__");
}
