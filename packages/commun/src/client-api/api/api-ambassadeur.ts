// L'espace ambassadeur, version API : missions et messages (routes /espace-ambassadeur de la session du site, compte
// d'ambassadeur actif), relectures d'avis (routes /app/avis). Les missions de l'API n'ont pas encore leur type ni la position
// de leur lieu : on complète prudemment (« autre », pas de position), en attendant qu'elles les portent.

import type { AvisARelire } from "../../types/avis.ts";
import type { EspaceAmbassadeur, MessageAmbassadeur, MissionAmbassadeur, TypeMission } from "../../types/espace-ambassadeur.ts";
import type { PositionLieu } from "../../types/lieu.ts";
import type { StatutAmbassadeur } from "../../types/roles.ts";
import type { ClientHttp } from "../client-http.ts";
import type { ServiceEspaceAmbassadeur } from "../contrat-espace-ambassadeur.ts";
import type { ReponseApi } from "../reponse-api.ts";
import { creerEcouteReguliere } from "./creer-ecoute-reguliere.ts";

const TYPES: readonly TypeMission[] = ["verifier-lieu", "verifier-big-sos", "controler-lieu", "autre"];
// Les messages et missions bougent peu : une relecture par minute suffit aux écrans abonnés
const INTERVALLE_MS = 60_000;

type MissionLue = Omit<MissionAmbassadeur, "type" | "presenceVerifieeLe" | "lieu"> & {
  type?: string;
  presenceVerifieeLe?: string | null;
  lieu: { id: number; nom: string; ville: string; emoji?: string; position?: PositionLieu | null } | null;
};

const completer = (m: MissionLue): MissionAmbassadeur => ({
  ...m,
  type: TYPES.includes(m.type as TypeMission) ? (m.type as TypeMission) : "autre",
  presenceVerifieeLe: m.presenceVerifieeLe ?? null,
  lieu: m.lieu ? { id: m.lieu.id, nom: m.lieu.nom, ville: m.lieu.ville, emoji: m.lieu.emoji ?? "📍", position: m.lieu.position ?? null } : null,
});

/** `lireStatut` : le statut d'ambassadeur du compte connecté (relu dans le compte de la session) */
export function creerAmbassadeurApi(client: ClientHttp, lireStatut: () => StatutAmbassadeur | null): ServiceEspaceAmbassadeur {
  const listerMissions = async (): Promise<ReponseApi<{ missions: MissionAmbassadeur[] }>> => {
    const r = await client.demander<{ missions: MissionLue[] }>("GET", "/espace-ambassadeur/missions");
    return r.ok ? { ok: true, missions: r.missions.map(completer) } : r;
  };
  const listerMessages = () => client.demander<{ messages: MessageAmbassadeur[] }>("GET", "/espace-ambassadeur/messages");
  const listerAvisARelire = () => client.demander<{ avis: AvisARelire[] }>("GET", "/app/avis/a-relire");

  return {
    async lireEspace(): Promise<ReponseApi<{ espace: EspaceAmbassadeur }>> {
      const statut = lireStatut();
      if (!statut) return { ok: false, erreur: "role-requis" };
      const [missions, messages, avis] = await Promise.all([listerMissions(), listerMessages(), listerAvisARelire()]);
      if (!missions.ok) return missions;
      if (!messages.ok) return messages;
      return {
        ok: true,
        espace: {
          statut,
          missionsAFaire: missions.missions.filter((m) => m.statut === "a-faire").length,
          avisARelire: avis.ok ? avis.avis.length : 0,
          messagesNonLus: messages.messages.filter((m) => m.luLe === null).length,
        },
      };
    },
    listerMissions,
    // « Je suis sur place » pour les missions : pas encore décidé ni construit côté serveur
    signalerPresence: async () => ({ ok: false, erreur: "service-indisponible" }),
    async terminerMission(missionId, compteRendu) {
      const r = await client.demander("POST", `/espace-ambassadeur/missions/${missionId}/compte-rendu`, { corps: { compteRendu } });
      if (!r.ok) return r;
      const relues = await listerMissions();
      const mission = relues.ok ? relues.missions.find((m) => m.id === missionId) : undefined;
      return mission ? { ok: true, mission } : { ok: false, erreur: "introuvable" };
    },
    listerAvisARelire,
    donnerVerdict: (avisId, verdict) => client.demander("POST", `/app/avis/${avisId}/relecture`, { corps: { verdict } }),
    listerMessages,
    marquerLu: (messageId) => client.demander("POST", `/espace-ambassadeur/messages/${messageId}/lu`),
    ecouter: creerEcouteReguliere(INTERVALLE_MS),
  };
}
