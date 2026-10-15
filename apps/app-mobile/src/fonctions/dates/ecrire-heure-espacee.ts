const INSECABLE = " ";

export function ecrireHeureEspacee(date: Date): string {
  const minutes = date.getMinutes();
  const heure = `${date.getHours()}${INSECABLE}h`;
  return minutes === 0 ? heure : `${heure}${INSECABLE}${String(minutes).padStart(2, "0")}`;
}
