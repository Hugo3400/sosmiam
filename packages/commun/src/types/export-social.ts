// Export RGPD de la partie sociale (GET /app/social/export), fait par la personne elle-même dans l'app : ses données
// sociales et SES messages déchiffrés, jamais ceux des autres, jamais son code d'invitation. À part, car il reprend les
// types de tous les domaines. L'export ne nomme jamais quelqu'un avec qui tu as un blocage, dans un sens ou dans l'autre,
// sauf dans « bloques » (ceux que TU as bloqués, comme Réglages › Personnes bloquées).
import type { DemandeBandeApi } from "./bande.ts";
import type { TypeCloche } from "./cloche.ts";
import type { CodeReaction, TypeConversation } from "./messagerie.ts";
import type { CibleSignalementSocial } from "./signalement.ts";
import type { CibleMasque, PersonneResume, ReglagesSociaux } from "./social.ts";
import type { LienSuiviApi } from "./suivis.ts";

export type ExportSocialApi = {
  genereLe: string;
  /** null : pas de profil social (Potes jamais ouvert) ; l'export dit quand même ce qui existe (signalements, masques…) */
  profil: { personne: PersonneResume; reglages: ReglagesSociaux; creeLe: string } | null;
  bande: { personne: PersonneResume; depuis: string }[];
  demandesBande: { envoyees: DemandeBandeApi[]; recues: DemandeBandeApi[] };
  bloques: PersonneResume[];
  suivis: {
    /** Ceux que tu suis (« suivi ») ou à qui tu as demandé (« demande » : en attente ; un refus, silencieux, se lit aussi ainsi) */
    abonnements: (LienSuiviApi & { statut: "suivi" | "demande" })[];
    /** Ceux qui te suivent (acceptés) */
    abonnes: LienSuiviApi[];
    /** Les demandes de suivi reçues qui attendent ta réponse (depuis : la date de la demande) */
    demandesRecues: LienSuiviApi[];
  };
  /**
   * Les conversations dont tu es membre (membres : leurs pseudos), et celles que tu as quittées où restent TES messages (sans
   * titre ni membres : tu n'en fais plus partie). Un privé avec quelqu'un avec qui il y a un blocage : toi seul en membre,
   * tes messages restent. messages : les tiens seulement ; pour une photo ou un vocal, la taille (le fichier n'est pas joint)
   */
  conversations: { id: string; type: TypeConversation; titre: string | null; membres: string[];
    messages: { date: string; type: "texte" | "lieu" | "photo" | "vocal"; texte: string | null; lieuId: number | null; taille: number | null }[] }[];
  /**
   * Les invitations à des groupes que tu n'as pas acceptées : en attente (« invite ») ou refusées (« refuse »). titre : celui
   * d'une invitation en attente seulement (null pour un refus, ou si celui qui t'invite a un blocage avec toi)
   */
  invitationsGroupes: { titre: string | null; date: string; statut: "invite" | "refuse" }[];
  reactions: { messageId: string; reaction: CodeReaction; date: string }[];
  sorties: { titre: string; quand: string; role: "organisateur" | "invite" | "participant"; propositions: number[]; votes: number[] }[];
  /**
   * auteur : le titre et tous les lieux ; co-auteur : les lieux que TU as ajoutés ; abonné : aucun lieu. Co-auteur et abonné :
   * titre null si la liste ne t'est plus visible (modération, blocage, compte devenu privé, liste réservée à la bande…)
   */
  listes: { titre: string | null; role: "auteur" | "co-auteur" | "abonne"; lieux: number[] }[];
  commentaires: { publicationId: string; texte: string; date: string }[];
  jaimesCommentaires: string[];
  cloche: { type: TypeCloche; date: string }[];
  /** Ce que TU as écrit en signalant (raison, précision, explication) et où il en est ; jamais la décision ni sa motivation */
  signalements: { cible: CibleSignalementSocial; raison: string; precision: string | null; explication: string; date: string; statut: string }[];
  masques: { cible: CibleMasque; cibleId: string }[];
};
