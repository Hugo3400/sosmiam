import { LIBELLES_ANIMAUX, LIBELLES_PAIEMENT, LIBELLES_RESERVATION } from "~/contenus/infos-pratiques";

/**
 * Une valeur d'un champ de fiche, en mots, pour les suggestions (« avant → après ») : vide → « (rien) », oui / non, les
 * libellés des animaux, de la réservation et des paiements ; le reste tel quel.
 */
export function ecrireValeurChamp(champ: string, valeur: unknown): string {
  if (valeur === null || valeur === undefined || valeur === "" || (Array.isArray(valeur) && valeur.length === 0)) return "(rien)";
  if (typeof valeur === "boolean") return valeur ? "Oui" : "Non";
  if (champ === "animaux" && typeof valeur === "string") return LIBELLES_ANIMAUX[valeur as keyof typeof LIBELLES_ANIMAUX]?.texte ?? valeur;
  if (champ === "reservation" && typeof valeur === "string") return LIBELLES_RESERVATION[valeur as keyof typeof LIBELLES_RESERVATION] ?? valeur;
  if (Array.isArray(valeur)) return valeur.map((code) => LIBELLES_PAIEMENT[code as keyof typeof LIBELLES_PAIEMENT] ?? String(code)).join(", ");
  return String(valeur);
}
