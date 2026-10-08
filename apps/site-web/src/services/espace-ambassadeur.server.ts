// « Mes missions » et « Mes messages » de l'espace ambassadeur : appels à l'API, côté serveur uniquement. Réservé aux
// ambassadeurs validés (l'API répond 403 « ambassadeur-non-actif » sinon). Contrat : apps/api/src/routes/espace-ambassadeur.ts.
import { appelerApiComptes } from "~/services/comptes.server";
import type { MessageAmbassadeur, MissionAmbassadeur } from "~/types/compte";

/** Les missions : à faire d'abord, puis les dernières faites ou annulées. */
export function listerMissions(jeton: string, ip: string | null) {
  return appelerApiComptes<{ missions: MissionAmbassadeur[] }>("/espace-ambassadeur/missions", { jeton, ip });
}

/** Termine une mission avec son compte rendu (5 à 2000 caractères). « introuvable » : pas la sienne, ou plus à faire. */
export function terminerMission(jeton: string, ip: string | null, id: number, compteRendu: string) {
  return appelerApiComptes<object>(`/espace-ambassadeur/missions/${id}/compte-rendu`, { methode: "POST", jeton, ip, corps: { compteRendu } });
}

/** Les messages de l'équipe (les siens et ceux à tous), avec la date de lecture. */
export function listerMessages(jeton: string, ip: string | null) {
  return appelerApiComptes<{ messages: MessageAmbassadeur[] }>("/espace-ambassadeur/messages", { jeton, ip });
}

/** Marque un message comme lu. */
export function marquerMessageLu(jeton: string, ip: string | null, id: number) {
  return appelerApiComptes<object>(`/espace-ambassadeur/messages/${id}/lu`, { methode: "POST", jeton, ip });
}
