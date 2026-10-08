/** Valeur d'un champ « date et heure » (heure de ce PC) → date ISO. Null si le champ est vide ou illisible. */
export function saisieVersIso(saisie: string): string | null {
  if (!saisie) return null;
  const date = new Date(saisie);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
