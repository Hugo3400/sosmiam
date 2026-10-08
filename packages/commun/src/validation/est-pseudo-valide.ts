import { FORME_PSEUDO } from "../regles/potes";

/**
 * Vrai si le pseudo a la bonne forme (3 à 20 caractères : minuscules, chiffres, point, tiret bas). L'unicité se vérifiera avec l'API.
 * La forme seulement : les gros mots se vérifient à part, quand on choisit un pseudo (pseudoContientMotInterdit), car
 * cette fonction sert aussi à relire un profil enregistré, qu'un mot ajouté plus tard à la liste ne doit pas rendre illisible.
 */
export function estPseudoValide(pseudo: unknown): pseudo is string {
  return typeof pseudo === "string" && FORME_PSEUDO.test(pseudo) && !pseudo.includes("..") && !pseudo.includes("__");
}
