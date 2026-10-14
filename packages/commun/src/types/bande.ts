// La bande (les potes, lien réciproque), son lien d'invitation, « Quoi de neuf » et le classement du mois, tels que l'API
// les rend (décidé le 14 octobre 2026 : un lien ou un QR ajoute tout de suite les deux personnes ; par pseudo, une demande).
import type { PersonneResume } from "./social.ts";

export type MembreBandeApi = { personne: PersonneResume; depuis: string };

export type DemandeBandeApi = { personne: PersonneResume; date: string };

export type BandeApi = { membres: MembreBandeApi[]; demandesRecues: DemandeBandeApi[]; demandesEnvoyees: DemandeBandeApi[]; max: number };

/** lien : « https://sosmiam.fr/invitation/<pseudo>#c=<code> » (creerLienInvitation de commun) */
export type InvitationBandeApi = { pseudo: string; code: string; lien: string; creeLe: string };

export type ActiviteBandeApi = {
  /** « rescousse:<id> », « garde:<idPublic>:<lieuId> », « badge:<id> », « liste:<id> » (pour la retirer de ta vue) */
  id: string;
  personne: PersonneResume;
  type: "rescousse" | "garde" | "badge" | "liste";
  lieuId?: number;
  /** Code du badge, ou titre de la liste */
  detail?: string;
  listeId?: string;
  date: string;
};

export type PlaceClassementApi = { personne: PersonneResume; pointsDuMois: number; rescoussesDuMois: number; rang: number; estMoi: boolean };

/** mois : « 2026-10 » à l'heure de Paris */
export type ClassementApi = { mois: string; places: PlaceClassementApi[] };
