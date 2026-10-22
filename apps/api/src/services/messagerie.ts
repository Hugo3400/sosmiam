// La messagerie entre potes, écrite une fois pour la base et pour les tests (voir messagerie-regles.ts) : conversations,
// privés, groupes, membres et invitations ; les messages, les médias et les lieux envoyés sont dans leurs propres fichiers,
// assemblés ici par creerMessagerie. Règles :
// - privé : entre deux potes de la même bande, une seule discussion par paire, en lecture seule s'ils ne sont plus potes ;
//   elle disparaît des deux côtés s'il y a un blocage ;
// - groupe (20 personnes au plus, invitations en attente comprises) : on n'y entre qu'en ACCEPTANT une invitation (réponse de
//   Hugo du 14/10/2026) ; un admin n'invite que des potes de SA bande ; un refus est silencieux et noté (pas de réinvitation) ;
//   qui part de lui-même ne peut pas être réinvité pendant 30 jours ; un nouveau membre voit la suite, pas l'historique ; le
//   dernier admin parti laisse sa place au plus ancien membre ; plus personne : la conversation est effacée ;
// - membres, rôles et titre : groupes seulement (privé : 404 ; discussion d'une sortie : 409 geree-par-la-sortie) ;
// - 404 avant 403 : on vérifie d'abord que tu es membre, ensuite seulement que tu es admin.
import { DUREE_DEPART_GROUPE_JOURS, MAX_PARTICIPANTS_GROUPE } from "../../../../packages/commun/src/regles/chat.ts";
import type { RoleConversation } from "../../../../packages/commun/src/types/messagerie.ts";
import { calculerClePrive } from "../fonctions/social/calculer-cle-prive.ts";
import { ecrirePushGroupe } from "../fonctions/social/ecrire-push-groupe.ts";
import { ecrireCurseurDate } from "../fonctions/social/ecrire-curseur-date.ts";
import { lireCurseurDate } from "../fonctions/social/lire-curseur-date.ts";
import type { EffetSocial } from "./effets-sociaux-regles.ts";
import { creerLieuxEnvoyes, type AssurerPrive } from "./lieux-envoyes.ts";
import { creerLectureMessagerie, exigerChiffrement, lireTitre, type AccesConversation } from "./messagerie-lecture.ts";
import { creerMediasMessagerie } from "./messagerie-medias.ts";
import { creerMessagesMessagerie } from "./messagerie-messages.ts";
import { creerPartagesMessagerie } from "./messagerie-partages.ts";
import { creerPhotoGroupe } from "./messagerie-photo-groupe.ts";
import { ecrireMessageSysteme } from "./messagerie-systeme.ts";
import { creerMemoireSonsInvitations } from "./sorties-regles.ts";
import {
  CONVERSATIONS_PAR_PAGE, MAX_INVITATIONS_LUES, MESSAGES_PAR_PAGE, type ContexteMessagerie, type LigneMembre, type RefusGroupe,
  type ServicesMessagerie,
} from "./messagerie-regles.ts";

const JOUR_MS = 24 * 60 * 60 * 1000;
const refus = <E extends string>(erreur: E) => ({ ok: false as const, erreur });

/** Une clé d'idempotence prise par un autre envoi pendant la transaction : on annule, puis on relit la première création */
class ClePrise extends Error {}

/**
 * Une invitation dans la cloche de chaque invité (sans le titre, chiffré : l'app le lit dans l'invitation), et sur son
 * téléphone (décidé par Hugo le 14/10/2026 : comme une invitation à une sortie, hors anti-spam ; l'applicateur ne la fait
 * partir que si l'invité veut les notifications sociales)
 */
const inviterDansLaCloche = (
  moi: number, conversationId: number, invites: readonly number[], prenom: string, titre: string | null, sonnent: ReadonlySet<number>,
): EffetSocial[] =>
  invites.flatMap((compteId): EffetSocial[] => [
    { quoi: "cloche", notification: { compteId, type: "invitation-groupe", acteurId: moi, cible: { type: "conversation", id: String(conversationId) } } },
    ...(sonnent.has(compteId) ? [{ quoi: "push" as const, compteId, sorte: "invitation-groupe" as const, message: ecrirePushGroupe({ prenom, titre }) }] : []),
  ]);

/** Le plus ancien membre (à égalité, le plus petit compte) */
const plusAncien = (membres: readonly LigneMembre[]) =>
  [...membres].sort((a, b) => a.arriveLe.getTime() - b.arriveLe.getTime() || a.compteId - b.compteId)[0];

export function creerMessagerie(c: ContexteMessagerie): ServicesMessagerie {
  const lire = c.depot.lire;
  const lecture = creerLectureMessagerie(c);
  const messages = creerMessagesMessagerie(c, lecture);
  const medias = creerMediasMessagerie(c, lecture, messages);
  const photo = creerPhotoGroupe(c, lecture, medias);
  const partages = creerPartagesMessagerie(c, lecture);
  const sons = creerMemoireSonsInvitations();

  /** Membre d'un GROUPE (privé : conversation-inconnue ; sortie : geree-par-la-sortie), et admin si demandé */
  async function lireAccesGroupe(moi: number, conversationId: number, admin: boolean): Promise<{ acces: AccesConversation } | { refus: RefusGroupe }> {
    const acces = await lecture.lireAcces(moi, conversationId);
    if (!acces || acces.conversation.type === "prive") return { refus: "conversation-inconnue" };
    if (acces.conversation.type === "sortie") return { refus: "geree-par-la-sortie" };
    if (admin && !(await lecture.estAdmin(moi, acces.membres))) return { refus: "reserve-aux-admins" };
    return { acces };
  }

  /** Les potes de ma bande, sans blocage, parmi ces comptes (dans la transaction `t`) */
  async function retenirPotes(t: typeof lire, moi: number, ids: readonly number[]): Promise<number[]> {
    const potes = await t.listerPotesParmi(moi, ids);
    const retenus: number[] = [];
    for (const id of ids) if (id !== moi && potes.has(id) && !(await t.bloqueEntre(moi, id))) retenus.push(id);
    return retenus;
  }

  const assurerPrive: AssurerPrive = async (moi, autre, maintenant) => {
    const cle = calculerClePrive(moi, autre);
    const existante = await lire.lireConversationPrivee(cle);
    if (existante) return { conversationId: existante.id, cree: false };
    return c.depot.ecrire(async (t) => {
      // Les deux comptes, dans l'ordre : deux « ouvrir » croisés ne créent qu'une discussion
      await t.verrouillerComptes([moi, autre]);
      const deja = await t.lireConversationPrivee(cle);
      if (deja) return { conversationId: deja.id, cree: false };
      if ((await retenirPotes(t, moi, [autre])).length === 0) return null;
      const id = await t.creerConversation({ type: "prive", clePrive: cle, emoji: null, creeParId: moi, maintenant });
      if (id === null) {
        const gagnante = await t.lireConversationPrivee(cle);
        return gagnante ? { conversationId: gagnante.id, cree: false } : null;
      }
      for (const compteId of [moi, autre]) {
        await t.ajouterMembre({ conversationId: id, compteId, role: "membre", visibleApres: 0, luJusqua: 0, coupee: false, arriveLe: maintenant });
      }
      return { conversationId: id, cree: true };
    });
  };

  /** Le groupe déjà créé avec cette clé, si j'en suis toujours membre */
  async function relireCreation(moi: number, conversationId: number, maintenant: Date) {
    const conversation = await lecture.presenterUne(moi, conversationId, maintenant);
    return conversation ? { ok: true as const, conversation, cree: false, ignores: [], effets: [] } : refus("conversation-inconnue");
  }

  const services: Omit<ServicesMessagerie, "envoyerLieu" | "listerLieuxRecus" | "listerLieuxEnvoyes" | "marquerLieuxVus"> = {
    async listerConversations(moi, apres, maintenant) {
      const lignes = await lire.listerMesConversations(moi, lireCurseurDate(apres) ?? null, CONVERSATIONS_PAR_PAGE + 1);
      const page = lignes.slice(0, CONVERSATIONS_PAR_PAGE);
      const dernier = page.at(-1);
      const suite = lignes.length > CONVERSATIONS_PAR_PAGE && dernier ? ecrireCurseurDate(dernier.dernierMessageLe, dernier.id) : null;
      // Effacées pour moi et privés bloqués : sautés après lecture (une page peut être plus courte, la suite reste juste)
      const conversations = await lecture.presenterConversations(moi, page, maintenant, { sansEffacees: true });
      if (apres) return { conversations, invitations: [], suite };
      const [invitations, epinglees] = await Promise.all([
        lire.listerMesInvitations(moi, MAX_INVITATIONS_LUES).then((lues) => lecture.presenterInvitations(moi, lues)),
        lire.listerMesEpinglees(moi).then((lues) => lecture.presenterConversations(moi, lues, maintenant, { sansEffacees: true })),
      ]);
      return { conversations, invitations, suite, epinglees };
    },

    async lireFil(moi, conversationId, o, maintenant) {
      const acces = await lecture.lireAcces(moi, conversationId);
      if (!acces) {
        const invitation = (await lire.lireInvitations([conversationId])).find((i) => i.compteId === moi && i.statut === "invite");
        if (!invitation) return null;
        const [presentee] = await lecture.presenterInvitations(moi, [invitation]);
        return presentee ? { invitation: presentee } : null;
      }
      const { conversation, membre } = acces;
      if (o.version !== null && o.avant === null && o.version === conversation.version) return { inchange: true, version: conversation.version };
      const [{ caches }, exclus] = await Promise.all([c.relations.listerBlocages(moi), lire.lireMessagesSignales(moi)]);
      const lignes = await lire.listerMessages(conversationId, { apres: membre.visibleApres, caches, exclus }, o.avant, MESSAGES_PAR_PAGE + 1);
      const page = lignes.slice(0, MESSAGES_PAR_PAGE);
      const [presentee] = await lecture.presenterConversations(moi, [conversation], maintenant);
      if (!presentee) return null;
      const suite = lignes.length > MESSAGES_PAR_PAGE && page.length > 0 ? String(page[page.length - 1]!.id) : null;
      const messagesApi = (await lecture.presenterMessages(moi, page, caches, maintenant, exclus)).reverse();
      return { conversation: presentee, messages: messagesApi, suite, version: conversation.version };
    },

    async ouvrirPrive(moi, autre, maintenant) {
      const prive = moi === autre ? null : await assurerPrive(moi, autre, maintenant);
      const conversation = prive ? await lecture.presenterUne(moi, prive.conversationId, maintenant) : null;
      if (!prive || !conversation) return refus("pas-dans-la-bande");
      return { ok: true, conversation, cree: prive.cree };
    },

    async creerGroupe(moi, g, cle, maintenant) {
      const chiffrement = exigerChiffrement(c);
      const deja = await lire.lireIdempotence(moi, cle);
      if (deja !== null) return relireCreation(moi, deja, maintenant);
      const candidats = [...new Set(g.invites)].filter((id) => id !== moi);
      if (candidats.length + 1 > MAX_PARTICIPANTS_GROUPE) return refus("groupe-plein");
      let issue: { refus: RefusGroupe } | { deja: number } | { id: number; invites: number[] };
      try {
        issue = await c.depot.ecrire(async (t) => {
          const encore = await t.lireIdempotence(moi, cle);
          if (encore !== null) return { deja: encore };
          const invites = await retenirPotes(t, moi, candidats);
          if (invites.length === 0) return { refus: "pas-dans-la-bande" as const };
          const id = await t.creerConversation({ type: "groupe", clePrive: null, emoji: g.emoji, creeParId: moi, maintenant });
          if (id === null) throw new Error("Groupe non créé");
          // Le titre est chiffré avec l'id de SA conversation (contexte authentifié) : il ne se relit nulle part ailleurs
          await t.ecrireGroupe(id, { titreChiffre: chiffrement.chiffrerTitre(g.titre, id) });
          await t.ajouterMembre({ conversationId: id, compteId: moi, role: "admin", visibleApres: 0, luJusqua: 0, coupee: false, arriveLe: maintenant });
          await t.creerInvitations(invites.map((compteId) => ({ conversationId: id, compteId, inviteParId: moi, statut: "invite", creeLe: maintenant, reponduLe: null })));
          if (!(await t.noterIdempotence(moi, cle, id, maintenant))) throw new ClePrise();
          return { id, invites };
        });
      } catch (erreur) {
        if (!(erreur instanceof ClePrise)) throw erreur;
        const premiere = await lire.lireIdempotence(moi, cle);
        return premiere === null ? refus("id-client-pris") : relireCreation(moi, premiere, maintenant);
      }
      if ("refus" in issue) return refus(issue.refus);
      if ("deja" in issue) return relireCreation(moi, issue.deja, maintenant);
      const conversation = await lecture.presenterUne(moi, issue.id, maintenant);
      if (!conversation) return refus("conversation-inconnue");
      const retenus = new Set(issue.invites);
      const prenom = (await c.relations.presenter([moi])).get(moi)?.prenom ?? "Un pote";
      return { ok: true, conversation, cree: true, ignores: candidats.filter((id) => !retenus.has(id)), effets: inviterDansLaCloche(moi, issue.id, issue.invites, prenom, g.titre, sons.retenir(issue.id, issue.invites, maintenant)) };
    },

    async modifierGroupe(moi, conversationId, m, maintenant) {
      const chiffrement = exigerChiffrement(c);
      const g = await lireAccesGroupe(moi, conversationId, true);
      if ("refus" in g) return refus(g.refus);
      const fait = await c.depot.ecrire(async (t) => {
        if (!(await t.verrouillerConversation(conversationId))) return false;
        await t.ecrireGroupe(conversationId, {
          ...(m.titre !== undefined ? { titreChiffre: chiffrement.chiffrerTitre(m.titre, conversationId) } : {}),
          ...(m.emoji !== undefined ? { emoji: m.emoji } : {}),
        });
        await t.toucherConversation(conversationId, maintenant, false);
        return true;
      });
      const conversation = fait ? await lecture.presenterUne(moi, conversationId, maintenant) : null;
      return conversation ? { ok: true, conversation } : refus("conversation-inconnue");
    },

    async inviter(moi, conversationId, invites, maintenant) {
      const g = await lireAccesGroupe(moi, conversationId, true);
      if ("refus" in g) return refus(g.refus);
      const candidats = [...new Set(invites)];
      const issue = await c.depot.ecrire(async (t): Promise<{ refus: RefusGroupe } | { nouveaux: number[] }> => {
        if (!(await t.verrouillerConversation(conversationId))) return { refus: "conversation-inconnue" };
        const membres = await t.lireMembres([conversationId]);
        if (!(await lecture.estAdmin(moi, membres))) return { refus: membres.some((m) => m.compteId === moi) ? "reserve-aux-admins" : "conversation-inconnue" };
        const invitations = await t.lireInvitations([conversationId]);
        const partis = await t.lireDeparts(conversationId, new Date(maintenant.getTime() - DUREE_DEPART_GROUPE_JOURS * JOUR_MS));
        // Déjà là, déjà invité (un refus compris : en silence) ou parti de lui-même depuis moins de 30 jours : ignoré sans le dire
        const dejaLa = new Set([moi, ...membres.map((m) => m.compteId), ...invitations.map((i) => i.compteId), ...partis]);
        const possibles = candidats.filter((id) => !dejaLa.has(id));
        const nouveaux = await retenirPotes(t, moi, possibles);
        if (nouveaux.length === 0 && possibles.length === candidats.length) return { refus: "pas-dans-la-bande" };
        const enAttente = invitations.filter((i) => i.statut === "invite").length;
        if (membres.length + enAttente + nouveaux.length > MAX_PARTICIPANTS_GROUPE) return { refus: "groupe-plein" };
        if (nouveaux.length === 0) return { nouveaux };
        await t.creerInvitations(nouveaux.map((compteId) => ({ conversationId, compteId, inviteParId: moi, statut: "invite", creeLe: maintenant, reponduLe: null })));
        await t.toucherConversation(conversationId, maintenant, false);
        return { nouveaux };
      });
      if ("refus" in issue) return refus(issue.refus);
      const conversation = await lecture.presenterUne(moi, conversationId, maintenant);
      if (!conversation) return refus("conversation-inconnue");
      const retenus = new Set(issue.nouveaux);
      const prenom = issue.nouveaux.length > 0 ? ((await c.relations.presenter([moi])).get(moi)?.prenom ?? "Un pote") : "";
      const titre = issue.nouveaux.length > 0 ? lireTitre(exigerChiffrement(c), g.acces.conversation) : null;
      return { ok: true, conversation, ignores: candidats.filter((id) => !retenus.has(id)), effets: inviterDansLaCloche(moi, conversationId, issue.nouveaux, prenom, titre, sons.retenir(conversationId, issue.nouveaux, maintenant)) };
    },

    async repondreInvitation(moi, conversationId, rejoint, maintenant) {
      const issue = await c.depot.ecrire(async (t) => {
        if (!(await t.verrouillerConversation(conversationId))) return null;
        if ((await t.lireMembres([conversationId])).some((m) => m.compteId === moi)) return "membre" as const;
        const invitation = (await t.lireInvitations([conversationId])).find((i) => i.compteId === moi);
        if (!invitation || invitation.statut !== "invite") return null;
        if (!rejoint) {
          await t.refuserInvitation(conversationId, moi, maintenant);
          return "refuse" as const;
        }
        await t.supprimerInvitation(conversationId, moi);
        await t.oublierDepart(conversationId, moi);
        // La suite, pas l'historique : tout ce qui est déjà écrit reste caché pour lui
        const dernier = (await t.lireDerniersIds([conversationId])).get(conversationId) ?? 0;
        await t.ajouterMembre({ conversationId, compteId: moi, role: "membre", visibleApres: dernier, luJusqua: dernier, coupee: false, arriveLe: maintenant });
        await t.toucherConversation(conversationId, maintenant, false);
        return "membre" as const;
      });
      if (issue === null) return refus("invitation-inconnue");
      if (issue === "refuse") return { ok: true, conversation: null };
      return { ok: true, conversation: await lecture.presenterUne(moi, conversationId, maintenant) };
    },

    async retirerMembre(moi, conversationId, membre, maintenant) {
      const quitter = membre === "moi" || membre === moi;
      const g = await lireAccesGroupe(moi, conversationId, !quitter);
      if ("refus" in g) return refus(g.refus);
      const effacees = await c.depot.ecrire(async (t) => {
        if (!(await t.verrouillerConversation(conversationId))) return null;
        if (!quitter) {
          const cible = membre as number;
          if ((await t.lireMembres([conversationId])).some((m) => m.compteId === cible)) await t.retirerMembre(conversationId, cible);
          else if (!(await t.lireInvitations([conversationId])).some((i) => i.compteId === cible && i.statut === "invite")) return null;
          else await t.supprimerInvitation(conversationId, cible);
          await t.toucherConversation(conversationId, maintenant, false);
          return null;
        }
        await t.retirerMembre(conversationId, moi);
        await t.noterDepart(conversationId, moi, maintenant);
        const restants = await t.lireMembres([conversationId]);
        if (restants.length === 0) return t.effacerConversations([conversationId]);
        const ancien = plusAncien(restants);
        if (ancien && !restants.some((m) => m.role === "admin")) await t.modifierMembre(conversationId, ancien.compteId, { role: "admin" });
        await t.toucherConversation(conversationId, maintenant, false);
        return null;
      });
      // Les photos et notes vocales du groupe effacé partent du disque une fois la transaction validée
      if (effacees) await effacees.apresTransaction();
      return { ok: true };
    },

    async changerRole(moi, conversationId, membre, role: RoleConversation, maintenant) {
      const g = await lireAccesGroupe(moi, conversationId, true);
      if ("refus" in g) return refus(g.refus);
      const fait = await c.depot.ecrire(async (t) => {
        if (!(await t.verrouillerConversation(conversationId))) return false;
        if (!(await t.modifierMembre(conversationId, membre, { role }))) return false;
        await t.toucherConversation(conversationId, maintenant, false);
        return true;
      });
      if (!fait) return refus("personne-inconnue");
      const conversation = await lecture.presenterUne(moi, conversationId, maintenant);
      return conversation ? { ok: true, conversation } : refus("conversation-inconnue");
    },

    couper: messages.couper,
    marquerLu: messages.marquerLu,
    epingler: messages.epingler,
    effacerPourMoi: messages.effacerPourMoi,
    envoyer: messages.envoyer,
    verifierEnvoiMedia: medias.verifierEnvoiMedia,
    envoyerMedia: medias.envoyerMedia,
    lireMedia: medias.lireMedia,
    supprimerMessage: messages.supprimerMessage,
    modifierMessage: messages.modifierMessage,
    poserMessageSysteme: (conversationId, systeme, texte, maintenant) =>
      c.depot.ecrire((t) => ecrireMessageSysteme(t, exigerChiffrement(c), { conversationId, systeme, texte, maintenant })),
    verifierPhotoGroupe: photo.verifierPhotoGroupe,
    changerPhotoGroupe: photo.changerPhotoGroupe,
    lirePhotoGroupe: photo.lirePhotoGroupe,
    listerPartages: partages.listerPartages,
    basculerReaction: messages.basculerReaction,
    lireMessageVisible: lecture.lireMessageVisible,
  };
  return { ...services, ...creerLieuxEnvoyes(c, assurerPrive, messages) };
}
