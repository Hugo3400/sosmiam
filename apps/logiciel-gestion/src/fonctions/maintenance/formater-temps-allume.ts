export function formaterTempsAllume(depuis: string, maintenant = Date.now()): string {
  const minutes = Math.max(0, Math.floor((maintenant - Date.parse(depuis)) / 60_000));
  const jours = Math.floor(minutes / 1440);
  const heures = Math.floor((minutes % 1440) / 60);
  if (jours > 0) return `${jours} j ${heures} h`;
  if (heures > 0) return `${heures} h ${String(minutes % 60).padStart(2, "0")}`;
  return `${minutes} min`;
}
