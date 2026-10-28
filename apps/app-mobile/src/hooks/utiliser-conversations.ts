import { createContext, useContext } from "react";

import type { InvitationGroupeChat, ReactionChat } from "@sos-miam/commun/types/conversations";
import type { GifApi, TypePartage } from "@sos-miam/commun/types/messagerie";
import type { ConversationEnrichie, PartagesChat, RequeteGif, ResultatGifs } from "~/contenus/type-discussion-chat";
import type { ResultatTexte } from "~/hooks/utiliser-communaute";
import type { SourceSociale } from "~/hooks/utiliser-source-sociale";

/** Refus d'envoi propres au chat */
export type ResultatEnvoiChat = ResultatTexte | "interdit";

export type ResultatModificationChat = ResultatEnvoiChat | "trop-tard" | "non-modifiable" | "compte-limite" | "reseau";

export type ResultatEpingleChat = "ok" | "plein" | "reseau";

export type ResultatSondageChat = "ok" | "lieux" | "fin" | "interdit";

export type ResultatVoteChat = "ok" | "clos" | "reseau";

export type ResultatGroupeChat = "ok" | "titre" | "interdit" | "compte-limite" | "reseau";

export type ResultatInvitationGroupeChat = "ok" | "plein" | "interdit" | "compte-limite" | "reseau";

export type ResultatPhotoGroupeChat = "ok" | "interdit" | "plein" | "reseau";

export type EtatConversations = {
  /** D'où vient le chat : le serveur (compte connecté), ou rien (visite, attente) */
  source: SourceSociale;
  pret: boolean;
  /** Tes conversations (privées et groupes), la plus récente d'abord, sans les personnes bloquées */
  conversations: ConversationEnrichie[];
  trouverConversation: (id: string) => ConversationEnrichie | null;
  /** Nombre de messages non lus, toutes conversations confondues (pastille sur Potes) */
  nonLus: number;
  nonLusDe: (id: string) => number;
  /** Vrai si tu peux discuter avec ce pote : il est dans ta bande, et pas bloqué */
  peutDiscuterAvec: (poteId: string) => boolean;
  /** Ouvre (ou crée) la conversation privée avec ce pote ; null si c'est interdit (ou pas de réseau) */
  ouvrirPrive: (poteId: string) => Promise<string | null>;
  /**
   * Crée un groupe avec ces potes (ceux avec qui tu ne peux pas discuter sont ignorés). Compte connecté : chacun reçoit une
   * invitation à accepter (décision de Hugo du 14/10/2026) ; « compte-limite » : ton compte est limité (rien à réessayer) ;
   * « reseau » : pas parti, réessaie
   */
  creerGroupe: (titre: string, emoji: string, potes: string[]) => Promise<{ id: string } | { erreur: "titre" | "participants" | "compte-limite" | "reseau" }>;
  /** Les invitations à rejoindre un groupe qui attendent ta réponse (compte connecté) */
  invitations: InvitationGroupeChat[];
  /** « Rejoindre le groupe ? » : oui (tu vois la suite, pas l'historique) ou non (en silence). Faux si ça n'a pas marché */
  repondreInvitation: (id: string, rejoint: boolean) => Promise<boolean>;
  /** L'écran d'une discussion s'ouvre : ses messages sont lus puis relus régulièrement ; la fonction rendue arrête */
  suivreFil: (id: string) => () => void;
  /** Charge les messages plus anciens d'une discussion (compte connecté, s'il en reste : conversation.plusAnciens) */
  chargerPlusAnciens: (id: string) => void;
  /** Renvoie un message qui n'est pas parti (état « echec ») ; sans effet sur un message en pause (envoisEnPause) */
  renvoyer: (conversationId: string, messageId: string) => void;
  /**
   * Les messages (état « echec ») que le serveur a refusés parce que ton compte est limité : pas une panne, ils ne repartent
   * pas (ni d'eux-mêmes, ni touchés) ; la bulle le dit et ouvre le pourquoi
   */
  envoisEnPause: ReadonlySet<string>;
  /**
   * Retire de l'écran un message en pause (envoisEnPause) : il n'est jamais parti, il disparaît du téléphone avec sa copie
   * (note vocale). Sans effet sur les autres messages
   */
  retirerEnPause: (messageId: string) => void;
  /** Coupe (ou remet) les notifications d'une discussion (compte connecté) */
  couper: (conversationId: string, coupee: boolean) => void;
  /** Efface la discussion pour toi seul : tu ne vois plus les messages d'avant, les autres les gardent */
  effacerPourMoi: (conversationId: string) => void;
  /** Supprime ton message pour tout le monde (compte connecté) : il reste « Message supprimé » */
  supprimerMessage: (conversationId: string, messageId: string) => void;
  envoyerTexte: (conversationId: string, texte: string, o?: { reponseA?: string }) => ResultatEnvoiChat;
  modifierMessage: (conversationId: string, messageId: string, texte: string) => Promise<ResultatModificationChat>;
  epingler: (conversationId: string, epinglee: boolean) => Promise<ResultatEpingleChat>;
  envoyerLieu: (conversationId: string, lieuId: number) => ResultatEnvoiChat;
  /** Photos choisies ou prise (fichiers temporaires du sélecteur), 10 au plus, avec un petit mot sous la première ; plusieurs : un album */
  envoyerPhotos: (conversationId: string, urisTemporaires: string[], legende?: string) => Promise<ResultatEnvoiChat>;
  /** Note vocale enregistrée (fichier temporaire de l'enregistreur), sa durée et la forme de la voix (calculerOndeVocal) */
  envoyerVocal: (conversationId: string, uriTemporaire: string, dureeSecondes: number, onde?: string) => Promise<ResultatEnvoiChat>;
  envoyerGif: (conversationId: string, gif: GifApi) => ResultatEnvoiChat;
  chercherGifs: (requete: RequeteGif, page: number) => Promise<ResultatGifs>;
  envoyerSondage: (conversationId: string, lieux: number[], finLe: string) => ResultatSondageChat;
  voterSondage: (conversationId: string, messageId: string, ordre: number | null) => Promise<ResultatVoteChat>;
  renommerGroupe: (conversationId: string, titre: string, emoji: string) => Promise<ResultatGroupeChat>;
  inviterAuGroupe: (conversationId: string, potes: string[]) => Promise<ResultatInvitationGroupeChat>;
  changerPhotoGroupe: (conversationId: string, uriTemporaire: string | null) => Promise<ResultatPhotoGroupeChat>;
  listerPartages: (conversationId: string, type: TypePartage, avant?: string) => Promise<PartagesChat | null>;
  basculerReaction: (conversationId: string, messageId: string, reaction: ReactionChat) => void;
  marquerLu: (conversationId: string) => void;
  /** Quitte un groupe : il disparaît de tes conversations et du téléphone, avec ses photos et notes vocales */
  quitterGroupe: (conversationId: string) => void;
  /** Efface tout le chat du téléphone */
  effacer: () => Promise<void>;
};

export const ContexteConversations = createContext<EtatConversations | null>(null);

/** Le chat entre potes : messages privés et groupes (fourni par FournisseurConversations). */
export function utiliserConversations(): EtatConversations {
  const etat = useContext(ContexteConversations);
  if (!etat) throw new Error("utiliserConversations doit être appelé sous <FournisseurConversations>.");
  return etat;
}
