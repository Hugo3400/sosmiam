/** Chrono d'une note vocale en cours d'enregistrement : 7 → « 0:07 », 60 → « 1:00 » (secondes entières, jamais négatives). */
export function formaterChronoEnregistrement(secondes: number): string {
  const total = Math.max(0, Math.floor(secondes));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
