// L'espace ambassadeur (app et ambassadeur.sosmiam.fr) : missions sur place, messages de l'équipe, compteurs.

import type { PositionLieu } from "./lieu.ts";
import type { StatutAmbassadeur } from "./roles.ts";

export type TypeMission = "verifier-lieu" | "verifier-big-sos" | "controler-lieu" | "autre";

/** Même forme que le site (apps/site-web/src/types/compte.ts), plus type, présence et position du lieu */
export type MissionAmbassadeur = {
  id: number;
  type: TypeMission;
  titre: string;
  detail: string;
  echeance: string | null;
  statut: "a-faire" | "faite" | "annulee";
  compteRendu: string | null;
  creeLe: string;
  faiteLe: string | null;
  presenceVerifieeLe: string | null;
  lieu: { id: number; nom: string; ville: string; emoji: string; position: PositionLieu | null } | null;
};

export type MessageAmbassadeur = { id: number; titre: string; texte: string; creeLe: string; luLe: string | null };

export type EspaceAmbassadeur = { statut: StatutAmbassadeur; missionsAFaire: number; avisARelire: number; messagesNonLus: number };
