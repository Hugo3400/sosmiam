export type MomentCreneau = "matin" | "midi" | "apres-midi" | "soir";

export type GroupeCreneaux = { moment: MomentCreneau; creneaux: string[] };

const DEBUT_MIDI = "11:00";
const DEBUT_APRES_MIDI = "15:00";
const DEBUT_SOIR = "18:00";

function lireMoment(heure: string): MomentCreneau {
  if (heure < DEBUT_MIDI) return "matin";
  if (heure < DEBUT_APRES_MIDI) return "midi";
  return heure < DEBUT_SOIR ? "apres-midi" : "soir";
}

export function grouperCreneauxReservation(creneaux: readonly string[]): GroupeCreneaux[] {
  const groupes: GroupeCreneaux[] = [];
  for (const heure of creneaux) {
    const moment = lireMoment(heure);
    const dernier = groupes.at(-1);
    if (dernier?.moment === moment) dernier.creneaux.push(heure);
    else groupes.push({ moment, creneaux: [heure] });
  }
  return groupes;
}
