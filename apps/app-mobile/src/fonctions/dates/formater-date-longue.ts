const nomsDesMois = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

/** « 2004-03-12 » → « 12 mars 2004 » (et « 1er mars 2004 » pour le premier du mois). */
export function formaterDateLongue(dateIso: string): string {
  const [annee, mois, jour] = dateIso.split("-").map(Number);
  return `${jour === 1 ? "1er" : jour} ${nomsDesMois[mois - 1]} ${annee}`;
}
