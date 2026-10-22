import { MAX_COMPTEUR_POULS } from "../../services/social-regles.ts";
import type {
  ConversationApi, MembreConversationApi, MessageApi, RoleConversation, TypeConversation,
} from "../../../../../packages/commun/src/types/messagerie.ts";
import type { PersonneResume } from "../../../../../packages/commun/src/types/social.ts";

/** Ce qu'il faut pour présenter une conversation à un de ses membres (déjà lu, déchiffré et filtré par le service) */
export type DonneesConversation = {
  conversation: { id: number; type: TypeConversation; version: number; dernierMessageLe: Date; sortieId: number | null; photo: boolean };
  /** Groupe : titre déchiffré (null s'il est illisible) ; sortie : titre de la sortie ; privé : null */
  titre: string | null;
  emoji: string | null;
  /** Ceux qui ont accepté, moi compris, par ordre d'arrivée */
  membres: MembreConversationApi[];
  /** Groupe : invitations en attente (et refus, tus) ; [] sinon */
  invites: PersonneResume[];
  /** Privé : l'autre personne ; null s'il a supprimé son compte */
  autre: PersonneResume | null;
  dernierMessage: MessageApi | null;
  nonLus: number;
  moi: { role: RoleConversation; luJusqua: number; coupee: boolean; epinglee: boolean };
  ouverte: boolean;
};

/** Une conversation telle que l'app la lit (B.11) : les id en texte, 99 non-lus au plus, luJusqua null tant que rien n'est lu */
export function presenterConversation(d: DonneesConversation): ConversationApi {
  return {
    id: String(d.conversation.id),
    type: d.conversation.type,
    titre: d.titre,
    emoji: d.emoji,
    membres: d.membres,
    invites: d.conversation.type === "groupe" ? d.invites : [],
    autre: d.conversation.type === "prive" ? d.autre : null,
    dernierMessage: d.dernierMessage,
    dernierMessageLe: d.conversation.dernierMessageLe.toISOString(),
    nonLus: Math.min(MAX_COMPTEUR_POULS, Math.max(0, d.nonLus)),
    luJusqua: d.moi.luJusqua > 0 ? String(d.moi.luJusqua) : null,
    coupee: d.moi.coupee,
    ouverte: d.ouverte,
    moi: { role: d.conversation.type === "groupe" ? d.moi.role : "membre" },
    sortieId: d.conversation.sortieId === null ? null : String(d.conversation.sortieId),
    version: d.conversation.version,
    epinglee: d.moi.epinglee,
    photo: d.conversation.type === "groupe" && d.conversation.photo,
  };
}
