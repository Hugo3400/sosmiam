/** Heure à la française : « 21:30 » → « 21h30 », « 20:00 » → « 20h ». */
export function formaterHeure(heure: string): string {
  const [h, m] = heure.split(":");
  return m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}`;
}
