/** Un délai en minutes, arrondi pour se lire d'un coup d'œil : « 12 min », « 3 h », « 2 j » (null : « — »). */
export function formaterDelaiMinutes(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))} min`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} h`;
  return `${Math.round(minutes / 1440)} j`;
}
