// La lecture de la messagerie, écrite une fois pour la base et pour les tests (voir messagerie-regles.ts) : qui voit quoi
// (règle d'accès de B.0), déchiffrement des textes et des titres, présentation des messages, des conversations et des
// invitations aux groupes. Blocages dans les deux sens : ce qu'écrit l'un est caché pour l'autre ; les membres restent
// nommés. Un texte illisible (clé changée, chiffré abîmé) se lit « illisible », sans rien citer au journal.
import { CODES_REACTIONS } from "../../../../packages/commun/src/regles/chat.ts";
import { peutAdministrerGroupe } from "../../../../packages/commun/src/fonctions/messagerie/peut-administrer-groupe.ts";
import type {
  CodeReaction, ConversationApi, InvitationGroupeApi, MembreConversationApi, MessageApi,
} from "../../../../packages/commun/src/types/messagerie.ts";
import type { PersonneResume } from "../../../../packages/commun/src/types/social.ts";
import { adapterMessageAncienneApp } from "../fonctions/social/adapter-message-ancienne-app.ts";
import { dechiffrerLieuSondage } from "../fonctions/social/dechiffrer-lieu-sondage.ts";
import { lireGifMessage } from "../fonctions/social/lire-gif-message.ts";
import { presenterConversation } from "../fonctions/social/presenter-conversation.ts";
import { presenterMessage, type ContenuMessage } from "../fonctions/social/presenter-message.ts";
import { presenterSondage, type LigneSondage } from "../fonctions/social/presenter-sondage.ts";
import type { ChiffrementSocial } from "./chiffrement-social.ts";
import { lireComplementsMessages } from "./messagerie-complements.ts";
import type {
  AppCliente, ContexteMessagerie, LigneConversation, LigneInvitationGroupe, LigneMembre, LigneMessage, LireMessageVisible, MessageVisible, TablesMessagerie,
} from "./messagerie-regles.ts";
import { lireAppCliente } from "../middlewares/app-cliente.ts";
import { MAX_COMPTEUR_POULS } from "./social-regles.ts";

/** Ce qu'il faut pour agir dans une conversation dont on est membre */
export type AccesConversation = { conversation: LigneConversation; membre: LigneMembre; membres: LigneMembre[] };

/** Les routes 🔐 ont déjà vérifié la clé : sans elle, c'est une erreur de branchement (500), jamais un texte en clair */
export function exigerChiffrement(c: Pick<ContexteMessagerie, "chiffrement">): ChiffrementSocial {
  if (!c.chiffrement) throw new Error("Chiffrement social absent : route sociale chiffrée sans exigerChiffrementSocial");
  return c.chiffrement;
}

/**
 * Le texte d'un message (ou le mot et le lieu d'un message « lieu », chiffrés ensemble ; la question d'un sondage ; le GIF
 * d'un message « gif »), ou « illisible ». Le petit mot d'une photo qui ne se relit pas est seulement absent : la photo reste
 */
export function lireContenu(chiffrement: ChiffrementSocial, l: LigneMessage): ContenuMessage | "illisible" {
  if (l.type === "vocal" || l.supprimeLe || l.retireLe || l.suspenduLe) return { texte: null, lieuId: null };
  if (l.type === "photo") {
    if (!l.texteChiffre) return { texte: null, lieuId: null };
    try {
      return { texte: chiffrement.dechiffrerMessage(l.texteChiffre, l.conversationId, l.idClient), lieuId: null };
    } catch {
      return { texte: null, lieuId: null };
    }
  }
  if (!l.texteChiffre) return "illisible";
  try {
    const clair = chiffrement.dechiffrerMessage(l.texteChiffre, l.conversationId, l.idClient);
    if (l.type === "texte" || l.type === "vote") return { texte: clair, lieuId: null };
    if (l.type === "gif") {
      const gif = lireGifMessage(clair);
      return gif ? { texte: null, lieuId: null, gif } : "illisible";
    }
    const lu: unknown = JSON.parse(clair);
    const { l: lieuId, m: mot } = (typeof lu === "object" && lu !== null ? lu : {}) as { l?: unknown; m?: unknown };
    if (typeof lieuId !== "number" || !Number.isSafeInteger(lieuId) || lieuId < 1 || (mot !== null && typeof mot !== "string")) return "illisible";
    return { texte: mot, lieuId };
  } catch {
    return "illisible";
  }
}

/** Le titre d'un groupe déchiffré (null s'il est illisible), ou celui de la sortie ; null pour un privé */
export function lireTitre(chiffrement: ChiffrementSocial, c: LigneConversation): string | null {
  if (c.type === "sortie") return c.sortie?.titre ?? null;
  if (c.type !== "groupe" || !c.titreChiffre) return null;
  try {
    return chiffrement.dechiffrerTitre(c.titreChiffre, c.id);
  } catch {
    return null;
  }
}

/** Par ordre d'arrivée (à égalité, le plus petit compte) */
const parArrivee = (a: LigneMembre, b: LigneMembre) => a.arriveLe.getTime() - b.arriveLe.getTime() || a.compteId - b.compteId;

export function creerLectureMessagerie(c: ContexteMessagerie) {
  const lire = c.depot.lire;

  /** Membre de la conversation, et pour un privé, aucun blocage avec l'autre (il disparaît alors des deux côtés) */
  async function lireAcces(moi: number, conversationId: number, t: TablesMessagerie = lire): Promise<AccesConversation | null> {
    const conversation = (await t.lireConversations([conversationId])).get(conversationId);
    if (!conversation) return null;
    const membres = await t.lireMembres([conversationId]);
    const membre = membres.find((m) => m.compteId === moi);
    if (!membre) return null;
    const autre = conversation.type === "prive" ? membres.find((m) => m.compteId !== moi) : undefined;
    if (autre && (await t.bloqueEntre(moi, autre.compteId))) return null;
    return { conversation, membre, membres };
  }

  /** On peut écrire : privé, vous êtes toujours potes (sans blocage) ; groupe et sortie, on en est membre (relu dans `t`) */
  async function estOuverte(t: TablesMessagerie, moi: number, acces: AccesConversation): Promise<boolean> {
    const membres = await t.lireMembres([acces.conversation.id]);
    if (!membres.some((m) => m.compteId === moi)) return false;
    if (acces.conversation.type !== "prive") return true;
    const autre = membres.find((m) => m.compteId !== moi);
    if (!autre) return false;
    return (await t.listerPotesParmi(moi, [autre.compteId])).has(autre.compteId) && !(await t.bloqueEntre(moi, autre.compteId));
  }

  /** Admin, ou (groupe sans admin) le plus ancien membre : la règle de l'app (peutAdministrerGroupe, commun) */
  async function estAdmin(moi: number, membres: readonly LigneMembre[]): Promise<boolean> {
    const personnes = await c.relations.presenter(membres.map((m) => m.compteId));
    const moiId = personnes.get(moi)?.id;
    if (!moiId) return false;
    const lignes = membres.flatMap((m) => {
      const p = personnes.get(m.compteId);
      return p ? [{ id: p.id, role: m.role, depuis: m.arriveLe.toISOString(), statut: "accepte" as const }] : [];
    });
    return peutAdministrerGroupe("groupe", moiId, lignes);
  }

  /**
   * Des messages visibles pour moi, avec leur auteur et leurs réactions (sans les personnes avec qui il y a un blocage) ; pour
   * une app d'avant la 1.0.2, un GIF ou un sondage devient un petit texte qui invite à mettre l'app à jour
   */
  async function presenterMessages(
    moi: number, lignes: readonly LigneMessage[], caches: ReadonlySet<number>, maintenant: Date, exclus?: ReadonlySet<number>, app: AppCliente = lireAppCliente(),
  ): Promise<MessageApi[]> {
    if (lignes.length === 0) return [];
    const chiffrement = exigerChiffrement(c);
    const lireUn = (l: LigneMessage) => lireContenu(chiffrement, l);
    const contenus = new Map(lignes.map((l) => [l.id, lireUn(l)]));
    const votes = lignes.filter((l) => l.type === "vote").map((l) => l.id);
    const [lues, complements, sondages] = await Promise.all([
      lire.lireReactions(lignes.map((l) => l.id)),
      lireComplementsMessages(c, moi, lignes, contenus, { caches, exclus, lireContenu: lireUn }),
      votes.length > 0 ? lire.lireSondages(votes) : new Map<number, LigneSondage>(),
    ]);
    const presenterVote = (l: LigneMessage) => {
      const sondage = sondages.get(l.id);
      return sondage
        ? presenterSondage(sondage, moi, (o) => dechiffrerLieuSondage(chiffrement, o.lieuChiffre, { conversationId: l.conversationId, idClient: l.idClient, ordre: o.ordre }))
        : undefined;
    };
    const reactions = lues.filter((r) => r.compteId === moi || !caches.has(r.compteId));
    const personnes = await c.relations.presenter([
      ...lignes.flatMap((l) => (l.auteurId === null ? [] : [l.auteurId])), ...reactions.map((r) => r.compteId), ...complements.comptes,
    ]);
    const presentes = lignes.map((l) => {
      const parCode: Partial<Record<CodeReaction, string[]>> = {};
      for (const code of CODES_REACTIONS) {
        const qui = reactions.filter((r) => r.messageId === l.id && r.reaction === code).flatMap((r) => personnes.get(r.compteId)?.id ?? []);
        if (qui.length > 0) parCode[code] = qui;
      }
      const auteur = l.auteurId === null ? null : (personnes.get(l.auteurId) ?? null);
      return presenterMessage(l, {
        auteur, contenu: contenus.get(l.id)!, reactions: parCode, maintenant, reponseA: complements.citation(l, personnes), mentions: complements.mentions(l, personnes),
        vote: l.type === "vote" ? presenterVote(l) : undefined,
      });
    });
    return app.ancienneApp ? presentes.map(adapterMessageAncienneApp) : presentes;
  }

  /**
   * Des conversations dont je suis membre, présentées (les autres sont sautées). Un privé avec quelqu'un avec qui il y a un
   * blocage est sauté. sansEffacees : sans celles que j'ai effacées pour moi tant qu'aucun message n'est arrivé depuis (pour
   * un groupe, mon « visibleApres » d'arrivée ne compte pas : le message qu'il désigne est d'avant mon arrivée). Pour une app
   * d'avant la 1.0.2 (app.ancienneApp), le dernier message n'est jamais un message de SOS Miam.
   */
  async function presenterConversations(
    moi: number, conversations: readonly LigneConversation[], maintenant: Date, o: { sansEffacees?: boolean } & AppCliente = {},
  ): Promise<ConversationApi[]> {
    if (conversations.length === 0) return [];
    const chiffrement = exigerChiffrement(c);
    const ancienneApp = o.ancienneApp ?? lireAppCliente().ancienneApp === true;
    const ids = conversations.map((x) => x.id);
    const [membres, invitations, blocages, exclus] = await Promise.all([
      lire.lireMembres(ids),
      lire.lireInvitations(conversations.filter((x) => x.type === "groupe").map((x) => x.id)),
      c.relations.listerBlocages(moi),
      lire.lireMessagesSignales(moi),
    ]);
    const { caches } = blocages;
    const mien = new Map(membres.filter((m) => m.compteId === moi).map((m) => [m.conversationId, m]));
    const autreDe = (id: number) => membres.find((m) => m.conversationId === id && m.compteId !== moi);
    let visibles = conversations.filter((x) => {
      if (!mien.has(x.id)) return false;
      const autre = x.type === "prive" ? autreDe(x.id) : undefined;
      return !autre || !caches.has(autre.compteId);
    });
    if (o.sansEffacees) {
      const [derniersIds, reperes] = await Promise.all([
        lire.lireDerniersIds(visibles.map((x) => x.id), ancienneApp),
        lire.lireMessages(visibles.map((x) => mien.get(x.id)!.visibleApres).filter((v) => v > 0)),
      ]);
      visibles = visibles.filter((x) => {
        const m = mien.get(x.id)!;
        if (m.visibleApres === 0 || (derniersIds.get(x.id) ?? 0) > m.visibleApres) return true;
        const repere = reperes.get(m.visibleApres);
        return x.type !== "prive" && (!repere || repere.creeLe.getTime() <= m.arriveLe.getTime());
      });
    }
    const [derniers, nonLus] = await Promise.all([
      lire.lireDerniersMessages(visibles.map((x) => ({ id: x.id, apres: mien.get(x.id)!.visibleApres })), caches, exclus, ancienneApp),
      lire.compterNonLus(moi, visibles.map((x) => ({ id: x.id, depuis: Math.max(mien.get(x.id)!.luJusqua, mien.get(x.id)!.visibleApres) })), caches, MAX_COMPTEUR_POULS, ancienneApp),
    ]);
    const messages = new Map((await presenterMessages(moi, [...derniers.values()], caches, maintenant, exclus, { ancienneApp })).map((m) => [Number(m.id), m]));
    const autres = visibles.flatMap((x) => (x.type === "prive" ? (autreDe(x.id)?.compteId ?? []) : []));
    const [liens, personnes, accuses] = await Promise.all([
      c.relations.lireLiens(moi, autres),
      c.relations.presenter([...membres.map((m) => m.compteId), ...invitations.map((i) => i.compteId)]),
      lire.lireAccusesLecture([...new Set(membres.map((m) => m.compteId))]),
    ]);
    const montreLu = (m: LigneMembre) =>
      m.compteId !== moi && m.luJusqua > 0 && m.luLe !== null && accuses.has(moi) && accuses.has(m.compteId) && !caches.has(m.compteId);
    return visibles.map((x) => {
      const moiMembre = mien.get(x.id)!;
      const autre = x.type === "prive" ? autreDe(x.id) : undefined;
      const lien = autre ? liens.get(autre.compteId) : undefined;
      const membresApi: MembreConversationApi[] = membres
        .filter((m) => m.conversationId === x.id)
        .sort(parArrivee)
        .flatMap((m) => {
          const personne = personnes.get(m.compteId);
          const lu = montreLu(m) && m.luLe ? { luJusqua: String(m.luJusqua), luLe: m.luLe.toISOString() } : {};
          return personne ? [{ personne, role: x.type === "groupe" ? m.role : "membre", depuis: m.arriveLe.toISOString(), ...lu }] : [];
        });
      const invites = invitations.filter((i) => i.conversationId === x.id).flatMap((i) => personnes.get(i.compteId) ?? []);
      const dernier = derniers.get(x.id);
      return presenterConversation({
        conversation: { id: x.id, type: x.type, version: x.version, dernierMessageLe: x.dernierMessageLe, sortieId: x.sortie?.id ?? null, photo: x.type === "groupe" && x.photo !== null },
        titre: lireTitre(chiffrement, x),
        emoji: x.type === "sortie" ? (x.sortie?.emoji ?? null) : x.type === "groupe" ? x.emoji : null,
        membres: membresApi,
        invites,
        autre: autre ? (personnes.get(autre.compteId) ?? null) : null,
        dernierMessage: dernier ? (messages.get(dernier.id) ?? null) : null,
        nonLus: nonLus.get(x.id) ?? 0,
        moi: { role: moiMembre.role, luJusqua: moiMembre.luJusqua, coupee: moiMembre.coupee, epinglee: moiMembre.epingleeLe !== null },
        ouverte: x.type !== "prive" || Boolean(lien && lien.pote && !lien.bloqueParMoi && !lien.mABloque),
      });
    });
  }

  /** Une conversation dont je suis membre, présentée ; null sinon */
  async function presenterUne(moi: number, conversationId: number, maintenant: Date, app: AppCliente = lireAppCliente()): Promise<ConversationApi | null> {
    const conversation = (await lire.lireConversations([conversationId])).get(conversationId);
    return conversation ? ((await presenterConversations(moi, [conversation], maintenant, app))[0] ?? null) : null;
  }

  /** Ce que voit un invité avant de répondre : titre, emoji, qui l'invite et combien de membres (jamais leurs noms) */
  async function presenterInvitations(moi: number, invitations: readonly LigneInvitationGroupe[]): Promise<InvitationGroupeApi[]> {
    const enAttente = invitations.filter((i) => i.compteId === moi && i.statut === "invite");
    if (enAttente.length === 0) return [];
    const chiffrement = exigerChiffrement(c);
    const ids = enAttente.map((i) => i.conversationId);
    const [conversations, membres, { caches }] = await Promise.all([lire.lireConversations(ids), lire.lireMembres(ids), c.relations.listerBlocages(moi)]);
    const personnes = await c.relations.presenter(enAttente.flatMap((i) => (i.inviteParId === null ? [] : [i.inviteParId])));
    return enAttente.flatMap((i) => {
      const conversation = conversations.get(i.conversationId);
      if (!conversation || conversation.type !== "groupe" || (i.inviteParId !== null && caches.has(i.inviteParId))) return [];
      const invitePar: PersonneResume | null = i.inviteParId === null ? null : (personnes.get(i.inviteParId) ?? null);
      return [{
        id: String(conversation.id),
        titre: lireTitre(chiffrement, conversation),
        emoji: conversation.emoji,
        invitePar,
        membres: membres.filter((m) => m.conversationId === conversation.id).length,
        date: i.creeLe.toISOString(),
      }];
    });
  }

  /** La règle d'accès de B.0 : de cette conversation, membre, après mon arrivée, auteur sans blocage avec moi (lu dans `t`) */
  async function lireVisible(moi: number, conversationId: number, messageId: number, t: TablesMessagerie = lire): Promise<MessageVisible | null> {
    const message = await t.lireMessage(messageId);
    if (!message || message.conversationId !== conversationId) return null;
    const acces = await lireAcces(moi, conversationId, t);
    if (!acces || message.id <= acces.membre.visibleApres) return null;
    if (message.auteurId !== null && message.auteurId !== moi && (await t.bloqueEntre(moi, message.auteurId))) return null;
    return { message, conversation: acces.conversation, membre: acces.membre };
  }
  const lireMessageVisible: LireMessageVisible = (moi, conversationId, messageId) => lireVisible(moi, conversationId, messageId);

  return { lireAcces, estOuverte, estAdmin, presenterMessages, presenterConversations, presenterUne, presenterInvitations, lireMessageVisible, lireVisible };
}

export type LectureMessagerie = ReturnType<typeof creerLectureMessagerie>;
