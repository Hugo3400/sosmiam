import { createContext, useContext } from "react";

import type { Conversation, ReactionChat } from "@sos-miam/commun/types/conversations";
import type { ResultatTexte } from "~/hooks/utiliser-communaute";

/** Refus d'envoi propres au chat */
export type ResultatEnvoiChat = ResultatTexte | "interdit";

export type EtatConversations = {
  pret: boolean;
  /** Tes conversations (privées et groupes), la plus récente d'abord, sans les personnes bloquées */
  conversations: Conversation[];
  trouverConversation: (id: string) => Conversation | null;
  /** Nombre de messages non lus, toutes conversations confondues (pastille sur Potes) */
  nonLus: number;
  nonLusDe: (id: string) => number;
  /** Vrai si tu peux discuter avec ce pote (protection des 15-17 ans : seulement des potes ajoutés en vrai) */
  peutDiscuterAvec: (poteId: string) => boolean;
  /** Vrai si cette conversation accepte photos et notes vocales (pas de mélange mineurs / adultes) */
  peutEnvoyerMedias: (conversationId: string) => boolean;
  /** Ouvre (ou crée) la conversation privée avec ce pote ; null si c'est interdit */
  ouvrirPrive: (poteId: string) => string | null;
  creerGroupe: (titre: string, emoji: string, potes: string[]) => { id: string } | { erreur: "titre" | "participants" };
  envoyerTexte: (conversationId: string, texte: string) => ResultatEnvoiChat;
  envoyerLieu: (conversationId: string, lieuId: number) => ResultatEnvoiChat;
  /** Photo choisie ou prise (fichier temporaire du sélecteur) */
  envoyerPhoto: (conversationId: string, uriTemporaire: string) => Promise<ResultatEnvoiChat>;
  /** Note vocale enregistrée (fichier temporaire de l'enregistreur) et sa durée */
  envoyerVocal: (conversationId: string, uriTemporaire: string, dureeSecondes: number) => Promise<ResultatEnvoiChat>;
  basculerReaction: (conversationId: string, messageId: string, reaction: ReactionChat) => void;
  marquerLu: (conversationId: string) => void;
  /** Quitte un groupe (il disparaît de tes conversations) */
  quitterGroupe: (conversationId: string) => void;
  /** Efface tout le chat du téléphone (la démo repartira de zéro) */
  effacer: () => Promise<void>;
};

export const ContexteConversations = createContext<EtatConversations | null>(null);

/** Le chat entre potes : messages privés et groupes (fourni par FournisseurConversations). */
export function utiliserConversations(): EtatConversations {
  const etat = useContext(ContexteConversations);
  if (!etat) throw new Error("utiliserConversations doit être appelé sous <FournisseurConversations>.");
  return etat;
}
