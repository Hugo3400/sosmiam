import { appeler } from "./client-gestion.ts";

export type PhaseBigSos = "demande" | "verification" | "vote" | "programme" | "a-la-une" | "a-cloturer" | "termine" | "refuse";
export type LienBigSos = { titre: string; adresse: string };
export type ResumeBigSos = {
  id: number;
  lieuId: number;
  origine: "lieu" | "ambassadeur" | "equipe";
  statut: string;
  phase: PhaseBigSos;
  debutLe: string | null;
  finLe: string | null;
  creeLe: string;
  modifieLe: string;
  objectifTitre: string | null;
  objectifCible: number | null;
  objectifAtteint: number;
  lieu: { id: number; nom: string; emoji: string; ville: string };
  mission: { statut: "a-faire" | "faite" | "annulee"; echeance: string | null; compte: { prenom: string } } | null;
};
export type FicheBigSos = Omit<ResumeBigSos, "lieu" | "mission"> & {
  histoire: string;
  liens: LienBigSos[];
  bilan: string | null;
  note: string | null;
  lieu: { id: number; nom: string; emoji: string; ville: string; quartier: string; statut: string };
  compte: { id: number; prenom: string } | null;
  mission: { id: number; titre: string; statut: "a-faire" | "faite" | "annulee"; echeance: string | null; compteRendu: string | null; faiteLe: string | null; compte: { id: number; prenom: string } } | null;
  /** Les autres BIG SOS de ce lieu, et combien d'autres sont à la une sur les mêmes dates (pour juger des limites) */
  memeLieu: { id: number; statut: string; debutLe: string | null; creeLe: string }[];
  enMemeTemps: number;
};
export type ModificationBigSos = Partial<{
  histoire: string; note: string | null; objectifTitre: string | null; objectifCible: number | null; objectifAtteint: number; liens: LienBigSos[]; bilan: string | null;
}>;
export type DecisionBigSos = { decision: "vote" | "refuser" | "rouvrir" } | { decision: "valider"; debutLe: string } | { decision: "terminer"; bilan: string };

export const listerBigSos = () => appeler<ResumeBigSos[]>("GET", "/big-sos");
export const lireBigSos = (id: number) => appeler<FicheBigSos>("GET", `/big-sos/${id}`);
export const creerBigSos = (saisie: { lieuId: number; histoire: string; note: string | null }) => appeler<{ id: number }>("POST", "/big-sos", { corps: saisie });
export const modifierBigSos = (id: number, modification: ModificationBigSos) => appeler<{ ok: true }>("PUT", `/big-sos/${id}`, { corps: modification });
export const envoyerVerification = (id: number, compteId: number, echeance: string | null) =>
  appeler<{ ok: true; missionId: number }>("POST", `/big-sos/${id}/verification`, { corps: { compteId, echeance } });
export const deciderBigSos = (id: number, decision: DecisionBigSos) => appeler<{ ok: true }>("POST", `/big-sos/${id}/decision`, { corps: decision });
export const supprimerBigSos = (id: number) => appeler<{ ok: true }>("DELETE", `/big-sos/${id}`);
