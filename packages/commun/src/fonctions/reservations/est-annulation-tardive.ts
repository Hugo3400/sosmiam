import { GRACE_ANNULATION_MS } from "../../regles/reglages-reservations.ts";
import { ANNULATION_TARDIVE_MS } from "../../regles/reservations.ts";

export function estAnnulationTardive(creneauMs: number, accepteeLeMs: number | null, maintenantMs: number): boolean {
  if (creneauMs - maintenantMs >= ANNULATION_TARDIVE_MS) return false;
  return accepteeLeMs === null || Number.isNaN(accepteeLeMs) || maintenantMs - accepteeLeMs > GRACE_ANNULATION_MS;
}
