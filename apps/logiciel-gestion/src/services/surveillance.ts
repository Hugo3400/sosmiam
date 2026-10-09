import { appeler } from "./client-gestion.ts";

/** Les seuils de la surveillance des visites, réglables (valeurs prudentes par défaut, décidées le 9 octobre 2026) */
export type SeuilsSurveillance = {
  parJour: number;
  partRefusMin: number;
  decisionsMin: number;
  lieuxPartRefusMin: number;
  lieuxDecisionsMin: number;
  fenetreJours: number;
};

type LieuResume = { id: number; nom: string; ville: string };

/** Pourquoi un compte est signalé : trop de visites validées un jour (jour de Paris, AAAA-MM-JJ), ou trop de refus */
export type RaisonCompte =
  | { type: "par-jour"; jour: string; validees: number }
  | { type: "refus"; refusees: number; decidees: number; part: number; lieux: number };

export type CompteSignale = {
  compte: { id: number; prenom: string; pseudo: string | null; ville: string | null; email: string; creeLe: string };
  raisons: RaisonCompte[];
  /** Pas encore vu (ou du nouveau depuis « vu ») */
  nouveau: boolean;
  /** Les lieux qui l'ont refusé sur la période, et combien de fois */
  refusPar: { lieu: LieuResume; refus: number }[];
  contestations: number;
};

export type LieuRefusant = {
  lieu: LieuResume;
  refusees: number;
  decidees: number;
  part: number;
  /** Nombre de refus par motif (« retiree » : validation annulée dans les 15 minutes) */
  motifs: Record<string, number>;
  nouveau: boolean;
};

export type ContestationVisite = {
  id: number;
  mode: string;
  /** « validee » : l'équipe a donné raison au client */
  statut: "refusee" | "retiree" | "validee";
  motifRefus: string | null;
  /** Le mot du client : lu par l'équipe SOS Miam, jamais montré au lieu */
  contestation: string | null;
  creeLe: string;
  decideLe: string | null;
  compte: { id: number; prenom: string; pseudo: string | null; email: string };
  lieu: LieuResume;
  /** L'équipe a donné raison au client : la visite est validée */
  raisonDonnee: boolean;
  relue: boolean;
};

export type Surveillance = {
  seuils: SeuilsSurveillance;
  parDefaut: SeuilsSurveillance;
  depuis: string;
  comptes: CompteSignale[];
  lieux: LieuRefusant[];
  contestations: ContestationVisite[];
};

export const lireSurveillance = () => appeler<Surveillance>("GET", "/surveillance");
export const reglerSeuilsSurveillance = (seuils: SeuilsSurveillance) =>
  appeler<{ ok: true; seuils: SeuilsSurveillance }>("PUT", "/surveillance/seuils", { corps: seuils });
/** « Vu, rien à signaler » : il revient s'il y a du nouveau (un autre jour au-delà du seuil, plus de refus) */
export const marquerSurveilleVu = (type: "comptes" | "lieux", id: number) => appeler<{ ok: true }>("POST", `/surveillance/${type}/${id}/vu`);
/** La visite passe en validée (points, tampon, avis) et le client est prévenu ; le lieu ne reçoit rien */
export const donnerRaisonAuClient = (id: number) => appeler<{ ok: true }>("POST", `/surveillance/contestations/${id}/raison`);
export const marquerContestationRelue = (id: number) => appeler<{ ok: true }>("POST", `/surveillance/contestations/${id}/relue`);
