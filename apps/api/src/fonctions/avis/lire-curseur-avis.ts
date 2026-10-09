/** Le curseur d'une page d'avis (?apres=, l'identifiant du dernier avis lu) : null s'il n'y en a pas, undefined s'il ne va pas */
export function lireCurseurAvis(brut: unknown): number | null | undefined {
  if (brut === undefined) return null;
  return typeof brut === "string" && /^[1-9]\d{0,9}$/.test(brut) && Number(brut) <= 2_147_483_647 ? Number(brut) : undefined;
}
