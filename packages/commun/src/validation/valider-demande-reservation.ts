import type { ErreurService } from "../types/erreurs-service.ts";
import type { CreneauOuverture } from "../types/lieu.ts";
import type { DemandeReservation } from "../types/reservation.ts";
import { MESSAGE_RESERVATION_MAX, PERSONNES_RESERVATION_MAX, PERSONNES_RESERVATION_MIN } from "../regles/reservations.ts";
import { listerCreneauxReservation } from "../fonctions/reservations/lister-creneaux-reservation.ts";
import { contientMotInterdit } from "./contient-mot-interdit.ts";

/**
 * Vérifie une demande de réservation (téléphone, puis API) : nombre de personnes, créneau réservable ce jour-là
 * (listerCreneauxReservation : horaires d'ouverture, au moins 30 min après maintenant, 30 jours au plus) et petit mot
 * facultatif (140 caractères, sans insulte). Rend la première erreur trouvée, ou null. Le lieu (existe, prend les
 * réservations) et les limites par compte sont vérifiés par le service.
 */
export function validerDemandeReservation(
  d: DemandeReservation,
  ouverture: readonly CreneauOuverture[],
  maintenant: Date,
): ErreurService | null {
  const { personnes, jour, heure, message } = d as Partial<Record<keyof DemandeReservation, unknown>>;
  if (
    typeof personnes !== "number" ||
    !Number.isInteger(personnes) ||
    personnes < PERSONNES_RESERVATION_MIN ||
    personnes > PERSONNES_RESERVATION_MAX
  ) {
    return "personnes-invalides";
  }
  if (typeof jour !== "string" || typeof heure !== "string") return "creneau-invalide";
  if (!listerCreneauxReservation(ouverture, jour, maintenant).includes(heure)) return "creneau-invalide";
  if (message !== null && message !== undefined) {
    if (typeof message !== "string") return "message-refuse";
    const texte = message.trim();
    if (texte.length > MESSAGE_RESERVATION_MAX || contientMotInterdit(texte)) return "message-refuse";
  }
  return null;
}
