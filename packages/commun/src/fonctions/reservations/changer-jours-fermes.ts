import { JOURS_FERMES_MAX } from "../../regles/reglages-reservations.ts";
import { validerJourFermeReservation } from "../../validation/valider-jour-ferme-reservation.ts";
import { lireJourSemaine } from "../temps/lire-jour-semaine.ts";
import { nettoyerJoursFermes } from "./nettoyer-jours-fermes.ts";

export type JoursFermesChanges = { ok: true; joursFermes: string[] } | { ok: false; champ: "jour" | "joursFermes" };

export function changerJoursFermes(joursFermes: readonly string[], jour: unknown, ferme: boolean, maintenant: Date): JoursFermesChanges {
  const actuels = nettoyerJoursFermes(joursFermes, maintenant);
  if (!ferme) {
    if (typeof jour !== "string" || lireJourSemaine(jour) === null) return { ok: false, champ: "jour" };
    return { ok: true, joursFermes: actuels.filter((j) => j !== jour) };
  }
  const valide = validerJourFermeReservation(jour, maintenant);
  if (valide === null) return { ok: false, champ: "jour" };
  if (actuels.includes(valide)) return { ok: true, joursFermes: actuels };
  if (actuels.length >= JOURS_FERMES_MAX) return { ok: false, champ: "joursFermes" };
  return { ok: true, joursFermes: [...actuels, valide].sort() };
}
