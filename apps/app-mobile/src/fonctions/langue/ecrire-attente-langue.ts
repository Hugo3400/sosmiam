import type { Langue } from "@sos-miam/commun/regles/langues";
import { ecrireAttente } from "~/fonctions/dates/ecrire-attente";

const INSECABLE = "\u00a0";
const MINUTE_MS = 60_000;

export function ecrireAttenteLangue(ms: number, langue: Langue): string {
  if (langue !== "en") return ecrireAttente(ms);
  const minutes = Math.max(1, Math.ceil(ms / MINUTE_MS));
  if (minutes < 60) return `${minutes}${INSECABLE}minute${minutes === 1 ? "" : "s"}`;
  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  if (reste === 0) return `${heures}${INSECABLE}hour${heures === 1 ? "" : "s"}`;
  return `${heures}${INSECABLE}hr${INSECABLE}${reste}${INSECABLE}min`;
}
