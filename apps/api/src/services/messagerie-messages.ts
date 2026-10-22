// Les messages de la messagerie, écrits une fois pour la base et pour les tests (voir messagerie-regles.ts) : envoyer un
// texte, un lieu, un sondage ou un GIF (chiffrés, idClient idempotent), supprimer le sien pour tout le monde, réagir, lire, couper,
// effacer pour soi. Ordre de chaque envoi, dans une seule transaction : verrou de la conversation, idClient déjà reçu
// (rejoué : rien de nouveau, aucune notification), lieu publié, droit d'écrire, version + 1, puis l'INSERT. Chaque autre
// membre est prévenu sur son téléphone (hors anti-spam, décision 4), sauf s'il a coupé la conversation, coupé les
// notifications sociales, ou s'il y a un blocage entre vous ; dans un groupe ou une sortie, une personne mentionnée
// (« @pseudo ») l'est même si elle a coupé la conversation. Le texte d'un message ne part dans une notification que chiffré
// pour le téléphone (réglage « Le message en entier », prevenirCompte), et jamais au journal.
import { DELAI_MODIFICATION_MESSAGE_MINUTES, MAX_CONVERSATIONS_EPINGLEES, QUESTION_SONDAGE } from "../../../../packages/commun/src/regles/chat.ts";
import type { CodeReaction, MessageApi } from "../../../../packages/commun/src/types/messagerie.ts";
import { chiffrerLieuSondage } from "../fonctions/social/chiffrer-lieu-sondage.ts";
import { ecrireGifMessage } from "../fonctions/social/ecrire-gif-message.ts";
import { ecrireApercuMessage } from "../fonctions/social/ecrire-apercu-message.ts";
import { ecrirePushMention } from "../fonctions/social/ecrire-push-mention.ts";
import { ecrirePushMessage } from "../fonctions/social/ecrire-push-message.ts";
import { trouverMentionnes } from "../fonctions/social/trouver-mentionnes.ts";
import type { EffetSocial } from "./effets-sociaux-regles.ts";
import { exigerChiffrement, lireTitre, type AccesConversation, type LectureMessagerie } from "./messagerie-lecture.ts";
import type { ContexteMessagerie, LigneMembre, LigneMessage, MessageAEnvoyer, RefusEnvoi, RefusModification, ResultatEnvoi } from "./messagerie-regles.ts";

const refus = <E extends string>(erreur: E) => ({ ok: false as const, erreur });

/** Ce qu'une transaction d'envoi rend : le message déjà là (rejoué), ou le nouveau avec la version et les membres à prévenir */
export type IssueEnvoi =
  | { refus: RefusEnvoi } | { deja: LigneMessage } | { message: LigneMessage; version: number; membres: LigneMembre[]; discret?: boolean };

/** Un message déjà reçu avec ce idClient : le même si c'est le mien, sinon ce idClient n'est pas le mien (400) */
export const relireEnvoi = (moi: number, deja: LigneMessage | null): IssueEnvoi | null =>
  deja ? (deja.auteurId === moi ? { deja } : { refus: "id-client-pris" }) : null;

export const SANS_AJOUTS = { reponseAId: null, modifieLe: null, album: null, onde: null, systeme: null } as const;

export function creerMessagesMessagerie(c: ContexteMessagerie, lecture: LectureMessagerie) {
  /** Les notifications d'un nouveau message : les autres membres, sans ceux qui ont coupé, ni blocage, ni pushSocial faux */
  async function prevenir(moi: number, acces: AccesConversation, message: LigneMessage, membres: readonly LigneMembre[], o: { texte: string | null; apercu: string | null; discret: boolean }): Promise<EffetSocial[]> {
    const { caches } = await c.relations.listerBlocages(moi);
    const autres = membres.filter((m) => m.compteId !== moi && !caches.has(m.compteId));
    const chercher = acces.conversation.type !== "prive" && o.texte !== null && o.texte.includes("@");
    if (autres.length === 0 || (o.discret && !chercher)) return [];
    const personnes = await c.relations.presenter([moi, ...(chercher ? autres.map((m) => m.compteId) : [])]);
    const mentionnes = new Set(chercher ? trouverMentionnes(o.texte!, autres.flatMap((m) => {
      const p = personnes.get(m.compteId);
      return p ? [{ compteId: m.compteId, pseudo: p.pseudo }] : [];
    })) : []);
    const candidats = autres.filter((m) => mentionnes.has(m.compteId) || (!o.discret && !m.coupee)).map((m) => m.compteId);
    const veulent = candidats.length > 0 ? await c.relations.lirePushSocial(candidats) : new Set<number>();
    const avecApercu = candidats.length > 0 && o.apercu ? await c.relations.lireApercuMessages(candidats) : new Set<number>();
    const prenom = personnes.get(moi)?.prenom ?? "Un pote";
    const conversation = { id: acces.conversation.id, type: acces.conversation.type, titre: lireTitre(exigerChiffrement(c), acces.conversation) };
    const sortieId = acces.conversation.sortie?.id ?? null;
    const push = ecrirePushMessage({ prenom, type: message.type, conversation, sortieId });
    const pushMention = ecrirePushMention({ prenom, conversation, sortieId });
    const apercu = (titre: string) => ecrireApercuMessage({ prenom, type: message.type, texte: o.apercu, titre, conversation });
    const apercus = { message: apercu(push.titre), mention: apercu(pushMention.titre) };
    const cible = { type: "conversation" as const, id: String(acces.conversation.id) };
    return [
      ...[...mentionnes].map((compteId): EffetSocial => ({ quoi: "cloche", notification: { compteId, type: "mention", acteurId: moi, cible } })),
      ...candidats.filter((id) => veulent.has(id)).map((compteId): EffetSocial => {
        const base = mentionnes.has(compteId) ? pushMention : push;
        const texte = mentionnes.has(compteId) ? apercus.mention : apercus.message;
        return { quoi: "push", compteId, message: texte && avecApercu.has(compteId) ? { ...base, apercu: texte } : base, sorte: "message" };
      }),
    ];
  }

  /** La suite commune d'un envoi (texte, lieu, photo, note vocale) : le message présenté, ses effets s'il est nouveau */
  async function terminerEnvoi(moi: number, acces: AccesConversation, issue: IssueEnvoi, maintenant: Date, texte: string | null = null, apercu: string | null = texte): Promise<ResultatEnvoi> {
    if ("refus" in issue) return refus(issue.refus);
    const { caches } = await c.relations.listerBlocages(moi);
    const ligne = "deja" in issue ? issue.deja : issue.message;
    const [message] = await lecture.presenterMessages(moi, [ligne], caches, maintenant) as [MessageApi];
    if ("deja" in issue) {
      const version = (await c.depot.lire.lireConversations([acces.conversation.id])).get(acces.conversation.id)?.version ?? acces.conversation.version;
      return { ok: true, message, version, rejoue: true, effets: [] };
    }
    const effets = await prevenir(moi, acces, issue.message, issue.membres, { texte, apercu, discret: issue.discret === true });
    return { ok: true, message, version: issue.version, rejoue: false, effets };
  }

  async function preparerContenu(moi: number, conversationId: number, m: MessageAEnvoyer): Promise<{ contenu: string } | IssueEnvoi> {
    if (m.type === "texte") return { contenu: m.texte };
    if (m.type === "lieu") return { contenu: JSON.stringify({ l: m.lieuId, m: m.texte }) };
    if (m.type === "vote") return { contenu: QUESTION_SONDAGE };
    const deja = relireEnvoi(moi, await c.depot.lire.lireMessageParIdClient(conversationId, m.idClient));
    if (deja) return deja;
    const gif = c.gif ? await c.gif.lire(m.gifId) : "indisponible";
    if (gif === "inconnu" || gif === "refuse" || gif === "indisponible") return { refus: `gif-${gif}` };
    return { contenu: ecrireGifMessage(gif) };
  }

  /** Un champ de message vide, pour INSERT */
  const sansMedia = { fichier: null, typeMime: null, taille: null, largeur: null, hauteur: null, dureeSecondes: null, mediaExpireLe: null };
  const sansEtat = { supprimeLe: null, suspenduLe: null, retireLe: null };

  return {
    terminerEnvoi,

    /**
     * Texte (1 à 500 caractères) ou lieu publié avec son mot (140), chiffrés ensemble, tels quels ; sondage d'un groupe (2 à 4
     * lieux publiés, chacun chiffré dans son option) ; GIF relu chez GIPHY avant la transaction, gardé chiffré
     */
    async envoyer(moi: number, conversationId: number, m: MessageAEnvoyer, maintenant: Date): Promise<ResultatEnvoi> {
      const chiffrement = exigerChiffrement(c);
      const acces = await lecture.lireAcces(moi, conversationId);
      if (!acces) return refus("conversation-inconnue");
      if (m.type === "vote" && acces.conversation.type !== "groupe") return refus("reserve-aux-groupes");
      const preparation = await preparerContenu(moi, conversationId, m);
      if (!("contenu" in preparation)) return terminerEnvoi(moi, acces, preparation, maintenant);
      const { contenu } = preparation;
      const issue = await c.depot.ecrire(async (t): Promise<IssueEnvoi> => {
        if (!(await t.verrouillerConversation(conversationId))) return { refus: "conversation-inconnue" };
        const deja = relireEnvoi(moi, await t.lireMessageParIdClient(conversationId, m.idClient));
        if (deja) return deja;
        // Après l'idClient : un envoi rejoué retrouve son message même si le lieu n'est plus publié depuis
        if (m.type === "lieu" && !(await t.estLieuPublie(m.lieuId))) return { refus: "lieu-inconnu" };
        if (m.type === "vote") for (const lieuId of m.lieux) if (!(await t.estLieuPublie(lieuId))) return { refus: "lieu-inconnu" };
        if (m.reponseA !== undefined) {
          const cite = (await lecture.lireVisible(moi, conversationId, m.reponseA, t))?.message;
          if (!cite || cite.systeme !== null || cite.supprimeLe || cite.retireLe || cite.suspenduLe) return { refus: "reponse-introuvable" };
        }
        if (!(await lecture.estOuverte(t, moi, acces))) return { refus: "conversation-fermee" };
        const version = await t.toucherConversation(conversationId, maintenant, true);
        if (version === null) return { refus: "conversation-inconnue" };
        const message = await t.insererMessage({
          conversationId, auteurId: moi, type: m.type, idClient: m.idClient, creeLe: maintenant, ...sansMedia, ...sansEtat, ...SANS_AJOUTS,
          reponseAId: m.reponseA ?? null,
          texteChiffre: chiffrement.chiffrerMessage(contenu, conversationId, m.idClient),
        });
        if (!message) return relireEnvoi(moi, await t.lireMessageParIdClient(conversationId, m.idClient)) ?? { refus: "conversation-inconnue" };
        if (m.type === "vote") {
          const options = m.lieux.map((lieuId, i) => ({ ordre: i + 1, lieuChiffre: chiffrerLieuSondage(chiffrement, lieuId, { conversationId, idClient: m.idClient, ordre: i + 1 }) }));
          await t.creerSondage({ messageId: message.id, finLe: m.finLe, options });
        }
        return { message, version, membres: await t.lireMembres([conversationId]) };
      });
      return terminerEnvoi(moi, acces, issue, maintenant, m.type === "texte" ? m.texte : null, m.type === "texte" || m.type === "lieu" ? m.texte : null);
    },

    async modifierMessage(moi: number, conversationId: number, messageId: number, texte: string, maintenant: Date): Promise<
      { ok: true; message: MessageApi; version: number } | { ok: false; erreur: RefusModification }> {
      const chiffrement = exigerChiffrement(c);
      const visible = await lecture.lireMessageVisible(moi, conversationId, messageId);
      if (!visible) return refus("message-inconnu");
      if (visible.message.auteurId !== moi) return refus("pas-l-auteur");
      const acces = await lecture.lireAcces(moi, conversationId);
      if (!acces) return refus("message-inconnu");
      const r = await c.depot.ecrire(async (t): Promise<{ refus: RefusModification } | { ligne: LigneMessage; version: number }> => {
        if (!(await t.verrouillerConversation(conversationId))) return { refus: "message-inconnu" };
        const m = await t.lireMessage(messageId);
        if (!m || m.conversationId !== conversationId || m.auteurId !== moi) return { refus: "message-inconnu" };
        if (m.type !== "texte" || m.systeme !== null || m.supprimeLe || m.retireLe || m.suspenduLe) return { refus: "non-modifiable" };
        if (maintenant.getTime() - m.creeLe.getTime() > DELAI_MODIFICATION_MESSAGE_MINUTES * 60_000) return { refus: "trop-tard" };
        if (!(await lecture.estOuverte(t, moi, acces))) return { refus: "conversation-fermee" };
        const texteChiffre = chiffrement.chiffrerMessage(texte, conversationId, m.idClient);
        await t.modifierMessage(messageId, { texteChiffre, modifieLe: maintenant });
        const version = (await t.toucherConversation(conversationId, maintenant, false)) ?? visible.conversation.version;
        return { ligne: { ...m, texteChiffre, modifieLe: maintenant }, version };
      });
      if ("refus" in r) return refus(r.refus);
      const { caches } = await c.relations.listerBlocages(moi);
      const [message] = await lecture.presenterMessages(moi, [r.ligne], caches, maintenant) as [MessageApi];
      return { ok: true, message, version: r.version };
    },

    /** Le sien, pour tout le monde (« Message supprimé ») : texte effacé tout de suite, fichier aussi (sauf s'il est signalé) */
    async supprimerMessage(moi: number, conversationId: number, messageId: number, maintenant: Date) {
      const visible = await lecture.lireMessageVisible(moi, conversationId, messageId);
      if (!visible) return refus("message-inconnu");
      if (visible.message.auteurId !== moi) return refus("reserve-a-l-auteur");
      const r = await c.depot.ecrire(async (t) => {
        if (!(await t.verrouillerConversation(conversationId))) return null;
        const ligne = await t.lireMessage(messageId);
        if (!ligne || ligne.supprimeLe) return { version: visible.conversation.version, fichier: null };
        await t.modifierMessage(messageId, { supprimeLe: maintenant, texteChiffre: null, fichier: null });
        if (ligne.type === "vote") await t.supprimerSondage(messageId);
        return { version: (await t.toucherConversation(conversationId, maintenant, false)) ?? visible.conversation.version, fichier: ligne.fichier };
      });
      if (!r) return refus("message-inconnu");
      if (r.fichier) await c.depot.supprimerFichiers([r.fichier]);
      return { ok: true as const, version: r.version };
    },

    /** Une réaction de chaque sorte par personne, cumulables ; seulement sur un message visible d'une conversation ouverte */
    async basculerReaction(moi: number, conversationId: number, messageId: number, reaction: CodeReaction, oui: boolean, maintenant: Date) {
      const visible = await lecture.lireMessageVisible(moi, conversationId, messageId);
      const m = visible?.message;
      if (!visible || !m || m.supprimeLe || m.suspenduLe || m.retireLe) return refus("message-inconnu");
      const acces = await lecture.lireAcces(moi, conversationId);
      if (!acces) return refus("message-inconnu");
      const r = await c.depot.ecrire(async (t) => {
        if (!(await t.verrouillerConversation(conversationId))) return null;
        if (!(await lecture.estOuverte(t, moi, acces))) return "fermee" as const;
        if (!(await t.basculerReaction(messageId, moi, reaction, oui, maintenant))) return visible.conversation.version;
        return (await t.toucherConversation(conversationId, maintenant, false)) ?? visible.conversation.version;
      });
      if (r === null) return refus("message-inconnu");
      if (r === "fermee") return refus("conversation-fermee");
      return { ok: true as const, version: r };
    },

    /**
     * Ne recule jamais ; ramené au dernier message visible pour moi (au plus `jusqua`). Montré aux autres (« Vu ») seulement
     * entre deux membres qui ont tous les deux les accusés de lecture : la conversation change alors de version
     */
    async marquerLu(moi: number, conversationId: number, jusqua: number, maintenant: Date): Promise<boolean> {
      const acces = await lecture.lireAcces(moi, conversationId);
      if (!acces) return false;
      const { caches } = await c.relations.listerBlocages(moi);
      const [dernier] = await c.depot.lire.listerMessages(conversationId, { apres: acces.membre.visibleApres, caches, exclus: new Set() }, jusqua + 1, 1);
      if (!dernier || dernier.id <= acces.membre.luJusqua) return true;
      const accuses = await c.depot.lire.lireAccusesLecture(acces.membres.map((m) => m.compteId));
      const vu = accuses.has(moi) && acces.membres.some((m) => m.compteId !== moi && accuses.has(m.compteId));
      await c.depot.ecrire(async (t) => {
        if (!vu) return t.avancerMembre(conversationId, moi, { luJusqua: dernier.id, luLe: maintenant });
        if (!(await t.verrouillerConversation(conversationId))) return;
        const avant = (await t.lireMembres([conversationId])).find((m) => m.compteId === moi);
        if (!avant || avant.luJusqua >= dernier.id) return;
        await t.avancerMembre(conversationId, moi, { luJusqua: dernier.id, luLe: maintenant });
        await t.toucherConversation(conversationId, maintenant, false);
      });
      return true;
    },

    /** « Effacer la discussion pour moi » : plus rien d'avant ; elle revient dans ma liste au prochain message */
    async effacerPourMoi(moi: number, conversationId: number): Promise<boolean> {
      const acces = await lecture.lireAcces(moi, conversationId);
      if (!acces) return false;
      const dernier = (await c.depot.lire.lireDerniersIds([conversationId])).get(conversationId) ?? 0;
      if (dernier > 0) await c.depot.ecrire((t) => t.avancerMembre(conversationId, moi, { visibleApres: dernier, luJusqua: dernier }));
      return true;
    },

    /** « Couper les notifications » de cette conversation (la cloche et les non-lus restent) */
    async couper(moi: number, conversationId: number, coupee: boolean): Promise<boolean> {
      const acces = await lecture.lireAcces(moi, conversationId);
      if (!acces) return false;
      await c.depot.ecrire((t) => t.modifierMembre(conversationId, moi, { coupee }));
      return true;
    },

    async epingler(moi: number, conversationId: number, epinglee: boolean, maintenant: Date) {
      const acces = await lecture.lireAcces(moi, conversationId);
      if (!acces) return refus("conversation-inconnue");
      if (acces.conversation.type === "sortie") return refus("geree-par-la-sortie");
      const r = await c.depot.ecrire(async (t) => {
        await t.verrouillerComptes([moi]);
        const membre = (await t.lireMembres([conversationId])).find((m) => m.compteId === moi);
        if (!membre) return "inconnue" as const;
        if (epinglee === (membre.epingleeLe !== null)) return "ok" as const;
        if (epinglee && (await t.compterEpinglees(moi)) >= MAX_CONVERSATIONS_EPINGLEES) return "plein" as const;
        await t.modifierMembre(conversationId, moi, { epingleeLe: epinglee ? maintenant : null });
        return "ok" as const;
      });
      if (r === "inconnue") return refus("conversation-inconnue");
      if (r === "plein") return refus("trop-d-epinglees");
      return { ok: true as const };
    },
  };
}

export type MessagesMessagerie = ReturnType<typeof creerMessagesMessagerie>;
