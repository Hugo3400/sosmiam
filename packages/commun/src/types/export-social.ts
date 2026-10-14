// Export RGPD de la partie sociale (GET /app/social/export), fait par la personne elle-même dans l'app : ses données
// sociales et SES messages déchiffrés, jamais ceux des autres, jamais son code d'invitation. À part, car il reprend les
// types de tous les domaines.
import type { DemandeBandeApi } from "./bande.ts";
import type { TypeCloche } from "./cloche.ts";
import type { CodeReaction, TypeConversation } from "./messagerie.ts";
import type { CibleSignalementSocial } from "./signalement.ts";
import type { CibleMasque, PersonneResume, ReglagesSociaux } from "./social.ts";
import type { LienSuiviApi } from "./suivis.ts";

export type ExportSocialApi = {
  genereLe: string;
  profil: { personne: PersonneResume; reglages: ReglagesSociaux; creeLe: string };
  bande: { personne: PersonneResume; depuis: string }[];
  demandesBande: { envoyees: DemandeBandeApi[]; recues: DemandeBandeApi[] };
  bloques: PersonneResume[];
  suivis: { abonnements: LienSuiviApi[]; abonnes: LienSuiviApi[] };
  /** Les conversations dont tu es membre ; membres : leurs pseudos */
  conversations: { id: string; type: TypeConversation; titre: string | null; membres: string[];
    messages: { date: string; type: "texte" | "lieu" | "photo" | "vocal"; texte: string | null; lieuId: number | null; taille: number | null }[] }[];
  /** Les invitations à des groupes que tu n'as pas acceptées : en attente (« invite ») ou refusées (« refuse ») */
  invitationsGroupes: { titre: string | null; date: string; statut: "invite" | "refuse" }[];
  reactions: { messageId: string; reaction: CodeReaction; date: string }[];
  sorties: { titre: string; quand: string; role: "organisateur" | "invite" | "participant"; propositions: number[]; votes: number[] }[];
  listes: { titre: string; role: "auteur" | "co-auteur" | "abonne"; lieux: number[] }[];
  commentaires: { publicationId: string; texte: string; date: string }[];
  jaimesCommentaires: string[];
  cloche: { type: TypeCloche; date: string }[];
  signalements: { cible: CibleSignalementSocial; raison: string; date: string; statut: string }[];
  masques: { cible: CibleMasque; cibleId: string }[];
};
