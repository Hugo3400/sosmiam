import type { MomentCreneau } from "../../types/reglages-reservations.ts";

const DEBUT_MIDI = "11:00";
const DEBUT_APRES_MIDI = "15:00";
const DEBUT_SOIR = "18:00";

export function lireMomentCreneau(heure: string): MomentCreneau {
  if (heure < DEBUT_MIDI) return "matin";
  if (heure < DEBUT_APRES_MIDI) return "midi";
  return heure < DEBUT_SOIR ? "apres-midi" : "soir";
}
