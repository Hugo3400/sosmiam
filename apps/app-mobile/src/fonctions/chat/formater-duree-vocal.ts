/** Durée d'une note vocale, comme sur un lecteur : 12 → « 0:12 », 60 → « 1:00 », 75 → « 1:15 ». */
export function formaterDureeVocal(secondes: number): string {
  const total = Number.isFinite(secondes) ? Math.max(0, Math.round(secondes)) : 0;
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
