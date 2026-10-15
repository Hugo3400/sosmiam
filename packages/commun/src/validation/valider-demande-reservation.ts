import type { ErreurService } from "../types/erreurs-service.ts";
import type { CreneauOuverture } from "../types/lieu.ts";
import type { OccupationReservation, ReglagesReservations } from "../types/reglages-reservations.ts";
import type { DemandeReservation } from "../types/reservation.ts";
import { HORAIRES_PROPOSES_MAX } from "../regles/reglages-reservations.ts";
import { MESSAGE_RESERVATION_MAX, PERSONNES_RESERVATION_MAX, PERSONNES_RESERVATION_MIN } from "../regles/reservations.ts";
import { listerCreneauxDisponibles } from "../fonctions/reservations/lister-creneaux-disponibles.ts";
import { contientMotInterdit } from "./contient-mot-interdit.ts";

export type CapaciteDemande = { reglages: ReglagesReservations | null; occupees: readonly OccupationReservation[] };

export function validerDemandeReservation(
  d: DemandeReservation,
  ouverture: readonly CreneauOuverture[],
  maintenant: Date,
  capacite: CapaciteDemande = { reglages: null, occupees: [] },
): ErreurService | null {
  const { personnes, jour, heure, autresHeures, message } = d as Partial<Record<keyof DemandeReservation, unknown>>;
  if (
    typeof personnes !== "number" ||
    !Number.isInteger(personnes) ||
    personnes < PERSONNES_RESERVATION_MIN ||
    personnes > PERSONNES_RESERVATION_MAX
  ) {
    return "personnes-invalides";
  }
  if (typeof jour !== "string" || typeof heure !== "string") return "creneau-invalide";
  const autres = autresHeures ?? [];
  if (!Array.isArray(autres) || autres.length > HORAIRES_PROPOSES_MAX - 1 || !autres.every((h) => typeof h === "string")) return "creneau-invalide";
  const heures = [heure, ...(autres as string[])];
  if (new Set(heures).size !== heures.length) return "creneau-invalide";
  const { reglages, occupees } = capacite;
  const possibles = new Set(listerCreneauxDisponibles({ ouverture, reglages, jour, maintenant }).map((c) => c.heure));
  if (!heures.every((h) => possibles.has(h))) return "creneau-invalide";
  if (message !== null && message !== undefined) {
    if (typeof message !== "string") return "message-refuse";
    const texte = message.trim();
    if (texte.length > MESSAGE_RESERVATION_MAX || contientMotInterdit(texte)) return "message-refuse";
  }
  const libres = new Set(listerCreneauxDisponibles({ ouverture, reglages, jour, maintenant, occupees, personnes }).map((c) => c.heure));
  return heures.some((h) => libres.has(h)) ? null : "creneau-complet";
}
