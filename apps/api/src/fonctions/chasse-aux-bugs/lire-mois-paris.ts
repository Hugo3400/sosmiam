const MOIS_PARIS = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit" });

export function lireMoisParis(date: Date): string {
  const morceaux = MOIS_PARIS.formatToParts(date);
  const annee = morceaux.find((m) => m.type === "year")?.value ?? "";
  const mois = morceaux.find((m) => m.type === "month")?.value ?? "";
  return `${annee}-${mois}`;
}
