import type { EnvoiRecent } from "~/services/courriels.ts";

const FENETRE_RELANCE_MS = 50 * 60_000;
const ANNONCE_RELANCE = /· nouvel essai à \d{2}:\d{2}$/;

export function estEnRelance(envoi: Pick<EnvoiRecent, "statut" | "erreur" | "creeLe">, maintenant = Date.now()): boolean {
  return envoi.statut === "echec" && ANNONCE_RELANCE.test(envoi.erreur ?? "") && maintenant - Date.parse(envoi.creeLe) < FENETRE_RELANCE_MS;
}
