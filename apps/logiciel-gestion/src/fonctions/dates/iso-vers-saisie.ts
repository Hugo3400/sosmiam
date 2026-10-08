/** Date ISO → valeur d'un champ « date et heure » (« 2026-10-08T19:30 »), à l'heure de ce PC. Vide si pas de date. */
export function isoVersSaisie(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
