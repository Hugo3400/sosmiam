// Contrat du service de l'espace ambassadeur : missions sur place, relectures d'avis (consultatives), messages de l'équipe.

import type { AvisARelire, VerdictRelecture } from "../types/avis.ts";
import type { EspaceAmbassadeur, MessageAmbassadeur, MissionAmbassadeur } from "../types/espace-ambassadeur.ts";
import type { LecturePosition } from "../types/position.ts";
import type { Desabonner, ReponseApi } from "./reponse-api.ts";

export interface ServiceEspaceAmbassadeur {
  lireEspace(): Promise<ReponseApi<{ espace: EspaceAmbassadeur }>>;
  listerMissions(): Promise<ReponseApi<{ missions: MissionAmbassadeur[] }>>;
  signalerPresence(missionId: number, position: LecturePosition): Promise<ReponseApi<{ mission: MissionAmbassadeur }>>;
  terminerMission(missionId: number, compteRendu: string): Promise<ReponseApi<{ mission: MissionAmbassadeur }>>;
  listerAvisARelire(): Promise<ReponseApi<{ avis: AvisARelire[] }>>;
  donnerVerdict(avisId: number, verdict: VerdictRelecture): Promise<ReponseApi>;
  listerMessages(): Promise<ReponseApi<{ messages: MessageAmbassadeur[] }>>;
  marquerLu(messageId: number): Promise<ReponseApi>;
  ecouter(rappel: () => void): Desabonner;
}
