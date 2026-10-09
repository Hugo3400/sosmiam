const MINUTE_MS = 60_000;

/** Depuis quand une demande attend au comptoir : « à l'instant », « depuis 3 min », « depuis 1 h 05 ». */
export function decrireAttente(depuis: string, maintenant: Date = new Date()): string {
  const minutes = Math.floor((maintenant.getTime() - Date.parse(depuis)) / MINUTE_MS);
  if (!Number.isFinite(minutes) || minutes < 1) return "à l'instant";
  if (minutes < 60) return `depuis ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  return reste === 0 ? `depuis ${heures} h` : `depuis ${heures} h ${String(reste).padStart(2, "0")}`;
}
