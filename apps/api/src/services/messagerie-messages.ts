// Les messages de la messagerie, écrits une fois pour la base et pour les tests (voir messagerie-regles.ts) : envoyer un
// texte ou un lieu (chiffrés tels quels, idClient idempotent), supprimer le sien pour tout le monde, réagir, lire, couper,
// effacer pour soi. Ordre de chaque envoi, dans une seule transaction : verrou de la conversation, idClient déjà reçu
// (rejoué : rien de nouveau, aucune notification), lieu publié, droit d'écrire, version + 1, puis l'INSERT. Chaque autre
// membre est prévenu sur son téléphone (hors anti-spam, décision 4), sauf s'il a coupé la conversation, coupé les
// notifications sociales, ou s'il y a un blocage entre vous. Jamais le texte d'un message dans une notification ni au journal.
import type { CodeReaction, MessageApi } from "../../../../packages/commun/src/types/messagerie.ts";
import { ecrirePushMessage } from "../fonctions/social/ecrire-push-message.ts";
import type { EffetSocial } from "./effets-sociaux-regles.ts";
import { exigerChiffrement, lireTitre, type AccesConversation, type LectureMessagerie } from "./messagerie-lecture.ts";
import type { ContexteMessagerie, LigneMembre, LigneMessage, MessageAEnvoyer, RefusEnvoi, ResultatEnvoi } from "./messagerie-regles.ts";

const refus = <E extends string>(erreur: E) => ({ ok: false as const, erreur });

/** Ce qu'une transaction d'envoi rend : le message déjà là (rejoué), ou le nouveau avec la version et les membres à prévenir */
export type IssueEnvoi = { refus: RefusEnvoi } | { deja: LigneMessage } | { message: LigneMessage; version: number; membres: LigneMembre[] };

/** Un message déjà reçu avec ce idClient : le même si c'est le mien, sinon ce idClient n'est pas le mien (400) */
export const relireEnvoi = (moi: number, deja: LigneMessage | null): IssueEnvoi | null =>
  deja ? (deja.auteurId === moi ? { deja } : { refus: "id-client-pris" }) : null;

export function creerMessagesMessagerie(c: ContexteMessagerie, lecture: LectureMessagerie) {
  /** Les notifications d'un nouveau message : les autres membres, sans ceux qui ont coupé, ni blocage, ni pushSocial faux */
  async function prevenir(moi: number, acces: AccesConversation, message: LigneMessage, membres: readonly LigneMembre[]): Promise<EffetSocial[]> {
    const { caches } = await c.relations.listerBlocages(moi);
    const candidats = membres.filter((m) => m.compteId !== moi && !m.coupee && !caches.has(m.compteId)).map((m) => m.compteId);
    if (candidats.length === 0) return [];
    const [veulent, personnes] = await Promise.all([c.relations.lirePushSocial(candidats), c.relations.presenter([moi])]);
    const push = ecrirePushMessage({
      prenom: personnes.get(moi)?.prenom ?? "Un pote",
      type: message.type,
      conversation: { id: acces.conversation.id, type: acces.conversation.type, titre: lireTitre(exigerChiffrement(c), acces.conversation) },
      sortieId: acces.conversation.sortie?.id ?? null,
    });
    return candidats.filter((id) => veulent.has(id)).map((compteId) => ({ quoi: "push", compteId, message: push, sorte: "message" }));
  }

  /** La suite commune d'un envoi (texte, lieu, photo, note vocale) : le message présenté, ses effets s'il est nouveau */
  async function terminerEnvoi(moi: number, acces: AccesConversation, issue: IssueEnvoi, maintenant: Date): Promise<ResultatEnvoi> {
    if ("refus" in issue) return refus(issue.refus);
    const { caches } = await c.relations.listerBlocages(moi);
    const ligne = "deja" in issue ? issue.deja : issue.message;
    const [message] = await lecture.presenterMessages(moi, [ligne], caches, maintenant) as [MessageApi];
    if ("deja" in issue) {
      const version = (await c.depot.lire.lireConversations([acces.conversation.id])).get(acces.conversation.id)?.version ?? acces.conversation.version;
      return { ok: true, message, version, rejoue: true, effets: [] };
    }
    return { ok: true, message, version: issue.version, rejoue: false, effets: await prevenir(moi, acces, issue.message, issue.membres) };
  }

  /** Un champ de message vide, pour INSERT */
  const sansMedia = { fichier: null, typeMime: null, taille: null, largeur: null, hauteur: null, dureeSecondes: null, mediaExpireLe: null };
  const sansEtat = { supprimeLe: null, suspenduLe: null, retireLe: null };

  return {
    terminerEnvoi,

    /** Texte (1 à 500 caractères) ou lieu publié avec son mot (140), chiffrés ensemble, tels quels */
    async envoyer(moi: number, conversationId: number, m: MessageAEnvoyer, maintenant: Date): Promise<ResultatEnvoi> {
      const chiffrement = exigerChiffrement(c);
      const acces = await lecture.lireAcces(moi, conversationId);
      if (!acces) return refus("conversation-inconnue");
      const contenu = m.type === "texte" ? m.texte : JSON.stringify({ l: m.lieuId, m: m.texte });
      const issue = await c.depot.ecrire(async (t): Promise<IssueEnvoi> => {
        if (!(await t.verrouillerConversation(conversationId))) return { refus: "conversation-inconnue" };
        const deja = relireEnvoi(moi, await t.lireMessageParIdClient(conversationId, m.idClient));
        if (deja) return deja;
        // Après l'idClient : un envoi rejoué retrouve son message même si le lieu n'est plus publié depuis
        if (m.type === "lieu" && !(await t.estLieuPublie(m.lieuId))) return { refus: "lieu-inconnu" };
        if (!(await lecture.estOuverte(t, moi, acces))) return { refus: "conversation-fermee" };
        const version = await t.toucherConversation(conversationId, maintenant, true);
        if (version === null) return { refus: "conversation-inconnue" };
        const message = await t.insererMessage({
          conversationId, auteurId: moi, type: m.type, idClient: m.idClient, creeLe: maintenant, ...sansMedia, ...sansEtat,
          texteChiffre: chiffrement.chiffrerMessage(contenu, conversationId, m.idClient),
        });
        if (!message) return relireEnvoi(moi, await t.lireMessageParIdClient(conversationId, m.idClient)) ?? { refus: "conversation-inconnue" };
        return { message, version, membres: await t.lireMembres([conversationId]) };
      });
      return terminerEnvoi(moi, acces, issue, maintenant);
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

    /** Ne recule jamais ; ramené au dernier message visible pour moi (au plus `jusqua`) ; jamais montré aux autres */
    async marquerLu(moi: number, conversationId: number, jusqua: number): Promise<boolean> {
      const acces = await lecture.lireAcces(moi, conversationId);
      if (!acces) return false;
      const { caches } = await c.relations.listerBlocages(moi);
      const [dernier] = await c.depot.lire.listerMessages(conversationId, { apres: acces.membre.visibleApres, caches, exclus: new Set() }, jusqua + 1, 1);
      if (dernier && dernier.id > acces.membre.luJusqua) await c.depot.ecrire((t) => t.avancerMembre(conversationId, moi, { luJusqua: dernier.id }));
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
  };
}

export type MessagesMessagerie = ReturnType<typeof creerMessagesMessagerie>;
