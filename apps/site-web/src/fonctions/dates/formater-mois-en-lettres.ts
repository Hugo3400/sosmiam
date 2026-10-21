const FORMAT_MOIS = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });

export function formaterMoisEnLettres(mois: string): string | null {
  const morceaux = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(mois);
  if (!morceaux) return null;
  return FORMAT_MOIS.format(new Date(Date.UTC(Number(morceaux[1]), Number(morceaux[2]) - 1, 1)));
}
