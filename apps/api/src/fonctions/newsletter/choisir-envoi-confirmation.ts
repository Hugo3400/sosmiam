import {
  ATTENTE_ENTRE_ENVOIS_CONFIRMATION, ENVOIS_MAX_CONFIRMATION, type AttenteConfirmation,
} from "../../services/confirmations-newsletter-regles.ts";

export type EnvoiConfirmation = "nouvelle" | "renvoi" | "attendre";

export function choisirEnvoiConfirmation(attente: Omit<AttenteConfirmation, "jetonEmpreinte"> | null, maintenant: Date): EnvoiConfirmation {
  if (!attente || attente.expireLe.getTime() <= maintenant.getTime()) return "nouvelle";
  if (maintenant.getTime() - attente.envoyeLe.getTime() < ATTENTE_ENTRE_ENVOIS_CONFIRMATION) return "attendre";
  return attente.envois < ENVOIS_MAX_CONFIRMATION ? "renvoi" : "attendre";
}
