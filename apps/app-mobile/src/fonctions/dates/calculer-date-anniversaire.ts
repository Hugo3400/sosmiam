import { formaterDateIso } from "~/fonctions/dates/formater-date-iso";

/**
 * Date (« AAAA-MM-JJ ») à laquelle on atteint cet âge, à partir d'une date de naissance « AAAA-MM-JJ ».
 * Né un 29 février : l'anniversaire tombe le 1er mars les années non bissextiles, comme dans calculerAge.
 */
export function calculerDateAnniversaire(dateNaissance: string, age: number): string {
  const [annee, mois, jour] = dateNaissance.split("-").map(Number);
  return formaterDateIso(new Date(annee + age, mois - 1, jour, 12));
}
