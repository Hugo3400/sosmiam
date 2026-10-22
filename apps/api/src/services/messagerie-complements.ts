import type { MessageCiteApi } from "../../../../packages/commun/src/types/messagerie.ts";
import type { PersonneResume } from "../../../../packages/commun/src/types/social.ts";
import { presenterCitation } from "../fonctions/social/presenter-citation.ts";
import type { ContenuMessage, LigneMessage } from "../fonctions/social/presenter-message.ts";
import { trouverMentionnes } from "../fonctions/social/trouver-mentionnes.ts";
import type { ContexteMessagerie, LigneConversation } from "./messagerie-regles.ts";

type Contenu = ContenuMessage | "illisible";
type Personnes = ReadonlyMap<number, PersonneResume>;

export type ComplementsMessages = {
  comptes: number[];
  citation: (l: LigneMessage, personnes: Personnes) => MessageCiteApi | undefined;
  mentions: (l: LigneMessage, personnes: Personnes) => string[] | undefined;
};

const AUCUN: ComplementsMessages = { comptes: [], citation: () => undefined, mentions: () => undefined };

const texteDe = (l: LigneMessage, contenu: Contenu | undefined) =>
  ((l.type === "texte" || l.type === "photo") && l.systeme === null && contenu && contenu !== "illisible" ? contenu.texte : null);

export async function lireComplementsMessages(
  c: ContexteMessagerie, moi: number, lignes: readonly LigneMessage[], contenus: ReadonlyMap<number, Contenu>,
  o: { caches: ReadonlySet<number>; exclus?: ReadonlySet<number>; lireContenu: (l: LigneMessage) => Contenu },
): Promise<ComplementsMessages> {
  const lire = c.depot.lire;
  const avecCitation = lignes.filter((l) => l.reponseAId !== null);
  const avecMention = lignes.filter((l) => texteDe(l, contenus.get(l.id))?.includes("@") ?? false);
  if (avecCitation.length === 0 && avecMention.length === 0) return AUCUN;
  const [cites, membres, conversations, exclus] = await Promise.all([
    lire.lireMessages(avecCitation.map((l) => l.reponseAId!)),
    lire.lireMembres([...new Set([...avecCitation, ...avecMention].map((l) => l.conversationId))]),
    avecMention.length > 0 ? lire.lireConversations([...new Set(avecMention.map((l) => l.conversationId))]) : new Map<number, LigneConversation>(),
    avecCitation.length === 0 ? new Set<number>() : (o.exclus ?? lire.lireMessagesSignales(moi)),
  ]);
  const miens = new Map(membres.filter((m) => m.compteId === moi).map((m) => [m.conversationId, m]));
  const groupes = new Set([...conversations.values()].filter((x) => x.type !== "prive").map((x) => x.id));
  return {
    comptes: [
      ...[...cites.values()].flatMap((m) => (m.auteurId === null ? [] : [m.auteurId])),
      ...membres.filter((m) => groupes.has(m.conversationId)).map((m) => m.compteId),
    ],
    citation(l, personnes) {
      const cite = l.reponseAId === null ? undefined : cites.get(l.reponseAId);
      if (!cite) return undefined;
      const mien = miens.get(l.conversationId);
      const cache = !mien || cite.conversationId !== l.conversationId || cite.id <= mien.visibleApres || exclus.has(cite.id)
        || (cite.auteurId !== null && cite.auteurId !== moi && o.caches.has(cite.auteurId));
      const auteurId = cite.auteurId === null ? null : (personnes.get(cite.auteurId)?.id ?? null);
      return presenterCitation(cite, { auteurId, contenu: cache ? "illisible" : o.lireContenu(cite), cache });
    },
    mentions(l, personnes) {
      const texte = texteDe(l, contenus.get(l.id));
      if (!texte || !groupes.has(l.conversationId)) return undefined;
      const candidats = membres.flatMap((m) => {
        const p = m.conversationId === l.conversationId && m.compteId !== l.auteurId ? personnes.get(m.compteId) : undefined;
        return p ? [{ compteId: m.compteId, pseudo: p.pseudo }] : [];
      });
      return trouverMentionnes(texte, candidats).flatMap((id) => personnes.get(id)?.id ?? []);
    },
  };
}
