import { FORME_ID_CLIENT } from "../regles/chat.ts";

/**
 * Vrai si c'est un idClient valable : un UUID v4 en minuscules, tiré par l'app pour un envoi (message, média, lieu envoyé)
 * ou une création (groupe, sortie, liste). Un même idClient renvoyé deux fois ne crée rien de plus.
 */
export function estIdClient(brut: unknown): brut is string {
  return typeof brut === "string" && FORME_ID_CLIENT.test(brut);
}
