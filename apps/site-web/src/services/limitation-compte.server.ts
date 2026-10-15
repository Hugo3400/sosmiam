// « Ton compte est limité » dans « Mon compte » : la limitation décidée par l'équipe et sa contestation, côté serveur
// uniquement. Contrat : apps/api/src/routes/comptes.ts (GET /comptes/moi/limitation, POST /comptes/moi/limitation/contestation).
import { appelerApiComptes } from "~/services/comptes.server";
import type { LimitationCompte } from "~/types/compte";

/** La limitation en cours ou à venir (null : aucune) */
export function lireLimitation(jeton: string, ip: string | null) {
  return appelerApiComptes<{ limitation: LimitationCompte | null }>("/comptes/moi/limitation", { jeton, ip });
}

/** Conteste la limitation en cours (10 à 1 000 caractères), une seule fois : 409 deja-conteste, 404 aucune-limitation */
export function contesterLimitation(jeton: string, ip: string | null, texte: string) {
  return appelerApiComptes<{ limitation: LimitationCompte }>("/comptes/moi/limitation/contestation", { methode: "POST", jeton, ip, corps: { texte } });
}
