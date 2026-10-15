const INSECABLE = " ";
const MINUTE_MS = 60_000;

export function ecrireAttente(ms: number): string {
  const minutes = Math.max(1, Math.ceil(ms / MINUTE_MS));
  if (minutes < 60) return `${minutes}${INSECABLE}minute${minutes > 1 ? "s" : ""}`;
  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  if (reste === 0) return `${heures}${INSECABLE}heure${heures > 1 ? "s" : ""}`;
  return `${heures}${INSECABLE}h${INSECABLE}${String(reste).padStart(2, "0")}`;
}
