import { appeler, parametres } from "./client-gestion.ts";

/** Onglets de l'écran Miam Safe */
export type VueMiamSafe = "a-traiter" | "traite" | "alertes" | "chartes";
export type ActionMiamSafe = "aucune" | "lieu-contacte" | "charte-retiree" | "lieu-masque";

type LieuResume = { id: number; nom: string; ville: string; emoji: string };

export type CompteursMiamSafe = { aTraiter: number; enRetard: number; sansReponse: number; chartes: number };

export type SignalementMiamSafe = {
  id: number;
  raison: string;
  explication: string;
  statut: "a-traiter" | "traite";
  action: ActionMiamSafe | null;
  note: string | null;
  creeLe: string;
  traiteLe: string | null;
  /** Plus de 48 heures sans décision (promis aux Miamis) */
  enRetard: boolean;
  lieu: LieuResume & { charteActive: boolean };
  /** La personne qui a raconté (null si elle a supprimé son compte) : jamais transmise au lieu */
  compte: { id: number; prenom: string; email: string } | null;
};

export type AlerteSansReponse = { id: number; prenom: string; endroit: string; detail: string; creeLe: string; lieu: LieuResume };
export type CharteLieu = { signeeLe: string; retireeLe: string | null; motifRetrait: string | null; lieu: LieuResume };

export type ListeMiamSafe = {
  vue: VueMiamSafe;
  compteurs: CompteursMiamSafe;
  signalements?: SignalementMiamSafe[];
  alertes?: AlerteSansReponse[];
  chartes?: CharteLieu[];
};

export const listerMiamSafe = (vue: VueMiamSafe) => appeler<ListeMiamSafe>("GET", `/miam-safe${parametres({ vue })}`);
/** Agir sur le lieu (le contacter, retirer sa charte, le masquer) demande une note d'au moins 10 caractères */
export const deciderSignalementMiamSafe = (id: number, choix: { action: ActionMiamSafe; note: string }) =>
  appeler<{ ok: true }>("POST", `/miam-safe/signalements/${id}/decision`, { corps: choix });
export const marquerAlerteVue = (id: number) => appeler<{ ok: true }>("POST", `/miam-safe/alertes/${id}/vue`);
/** Après échange avec le lieu : il peut de nouveau signer la charte depuis l'espace pro */
export const rendreCharte = (lieuId: number) => appeler<{ ok: true }>("POST", `/miam-safe/chartes/${lieuId}/rendre`);
