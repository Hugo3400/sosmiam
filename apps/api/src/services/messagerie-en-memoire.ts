// Les gestes élémentaires de la messagerie EN MÉMOIRE, pour les tests (contrat dans messagerie-regles.ts), posés sur les
// tables partagées (tables-sociales-en-memoire.ts) : la bande, les blocages, les sorties, les masques et les signalements
// écrits par les autres domaines se voient ici. Aucune règle : ce sont celles de la base (messagerie.ts) qui tournent
// au-dessus. Une seule demande avance à la fois entre deux await : les verrous n'ont rien à faire.
import type { CodeReaction, RoleConversation, TypeConversation } from "../../../../packages/commun/src/types/messagerie.ts";
import type { Conversation, InvitationGroupe, MembreConversation, MessageConversation } from "../base-de-donnees/client-genere/client.ts";
import type { LigneMessage } from "../fonctions/social/presenter-message.ts";
import type { DepotMessagerie, FiltreMessages, LigneConversation, LigneInvitationGroupe, LigneMembre, TablesMessagerie } from "./messagerie-regles.ts";
import type { RelationsSociales } from "./relations-sociales-regles.ts";
import { creerTablesSondagesEnMemoire } from "./messagerie-sondages-en-memoire.ts";
import type { StockageMediasChat } from "./stockage-medias-chat.ts";
import { effacerConversationsEnMemoire, lireFichiersGardesEnMemoire, prendreId, type TablesSociales } from "./tables-sociales-en-memoire.ts";

const DUREE_MEDIAS_MS = 90 * 24 * 60 * 60 * 1000;

const versMembre = (m: MembreConversation): LigneMembre => ({ ...m, role: m.role as RoleConversation });
const versInvitation = (i: InvitationGroupe): LigneInvitationGroupe => ({ ...i, statut: i.statut === "refuse" ? "refuse" : "invite" });
const versMessage = (m: MessageConversation): LigneMessage => ({ ...m, type: m.type as LigneMessage["type"] });
/** Un message visible selon le filtre : auteur sans blocage (un compte supprimé reste visible), pas signalé */
const estVisible = (m: MessageConversation, f: Omit<FiltreMessages, "apres">) =>
  (m.auteurId === null || !f.caches.has(m.auteurId)) && !f.exclus.has(m.id) && (!f.sansSystemes || m.systeme === null);
/** Retire d'un tableau, sur place (comme un DELETE ; les autres domaines lisent le même tableau) ; rend le nombre retiré */
function retirer<T>(lignes: T[], quoi: (ligne: T) => boolean): number {
  let retires = 0;
  for (let i = lignes.length - 1; i >= 0; i--) {
    if (quoi(lignes[i]!)) {
      lignes.splice(i, 1);
      retires += 1;
    }
  }
  return retires;
}
/** Comme ORDER BY cree_le DESC, id DESC */
const plusRecentDabord = (a: MessageConversation, b: MessageConversation) => b.creeLe.getTime() - a.creeLe.getTime() || b.id - a.id;

export function creerTablesMessagerieEnMemoire(tables: TablesSociales, relations: RelationsSociales, medias: StockageMediasChat): TablesMessagerie {
  const versConversation = (c: Conversation): LigneConversation => {
    const sortie = [...tables.sorties.values()].find((s) => s.conversationId === c.id);
    return { ...c, type: c.type as TypeConversation, sortie: sortie ? { id: sortie.id, titre: sortie.titre, emoji: sortie.emoji } : null };
  };
  const membreDe = (conversationId: number, compteId: number) => tables.membres.find((m) => m.conversationId === conversationId && m.compteId === compteId);
  const messagesDe = (conversationId: number) => [...tables.messages.values()].filter((m) => m.conversationId === conversationId);
  /** Les lieux des privés dont je suis membre, après mon « Effacer pour moi », dans un privé sans personne de bloqué */
  const lieuxDesPrives = (moi: number, caches: ReadonlySet<number>) => [...tables.messages.values()].filter((m) => {
    const conversation = tables.conversations.get(m.conversationId);
    const membre = membreDe(m.conversationId, moi);
    return conversation?.type === "prive" && membre && m.type === "lieu" && m.id > membre.visibleApres && !m.supprimeLe && !m.suspenduLe && !m.retireLe
      && !tables.membres.some((o) => o.conversationId === m.conversationId && caches.has(o.compteId));
  });

  return {
    ...creerTablesSondagesEnMemoire(tables),

    async lireConversations(ids) {
      return new Map(ids.flatMap((id) => {
        const c = tables.conversations.get(id);
        return c ? [[id, versConversation(c)] as const] : [];
      }));
    },
    async lireConversationPrivee(clePrive) {
      const c = [...tables.conversations.values()].find((x) => x.clePrive === clePrive);
      return c ? versConversation(c) : null;
    },
    async listerMesConversations(compteId, apres, nombre) {
      return [...tables.conversations.values()]
        .filter((c) => c.type !== "sortie" && membreDe(c.id, compteId))
        .filter((c) => !apres || c.dernierMessageLe.getTime() < apres.date.getTime() || (c.dernierMessageLe.getTime() === apres.date.getTime() && c.id < apres.id))
        .sort((a, b) => b.dernierMessageLe.getTime() - a.dernierMessageLe.getTime() || b.id - a.id)
        .slice(0, nombre)
        .map(versConversation);
    },
    async verrouillerConversation(id) {
      return tables.conversations.has(id);
    },
    async toucherConversation(id, maintenant, message) {
      const c = tables.conversations.get(id);
      if (!c) return null;
      Object.assign(c, { version: c.version + 1, modifieLe: maintenant }, message ? { dernierMessageLe: maintenant } : {});
      return c.version;
    },
    async creerConversation(c) {
      if (c.clePrive && [...tables.conversations.values()].some((x) => x.clePrive === c.clePrive)) return null;
      const id = prendreId(tables, "conversations");
      tables.conversations.set(id, {
        id, type: c.type, clePrive: c.clePrive, titreChiffre: null, emoji: c.emoji, photo: null, creeParId: c.creeParId, version: 0,
        dernierMessageLe: c.maintenant, modifieLe: c.maintenant, creeLe: c.maintenant,
      });
      return id;
    },
    async ecrireGroupe(id, m) {
      const c = tables.conversations.get(id);
      if (c) Object.assign(c, m);
    },
    effacerConversations: (ids) => effacerConversationsEnMemoire(tables, ids, medias),

    async lireMembres(conversationIds) {
      const ids = new Set(conversationIds);
      return tables.membres.filter((m) => ids.has(m.conversationId)).map(versMembre);
    },
    async ajouterMembre(m) {
      if (!membreDe(m.conversationId, m.compteId)) tables.membres.push({ ...m, epingleeLe: null, luLe: null });
    },
    async modifierMembre(conversationId, compteId, m) {
      const membre = membreDe(conversationId, compteId);
      if (membre) Object.assign(membre, m);
      return Boolean(membre);
    },
    async avancerMembre(conversationId, compteId, m) {
      const membre = membreDe(conversationId, compteId);
      if (!membre) return;
      if (m.luJusqua !== undefined && m.luJusqua > membre.luJusqua) Object.assign(membre, { luJusqua: m.luJusqua }, m.luLe !== undefined ? { luLe: m.luLe } : {});
      if (m.visibleApres !== undefined) membre.visibleApres = Math.max(membre.visibleApres, m.visibleApres);
    },
    async retirerMembre(conversationId, compteId) {
      retirer(tables.membres, (m) => m.conversationId === conversationId && m.compteId === compteId);
    },
    async listerMesEpinglees(compteId) {
      return tables.membres
        .filter((m) => m.compteId === compteId && m.epingleeLe !== null && tables.conversations.get(m.conversationId)?.type !== "sortie")
        .sort((a, b) => b.epingleeLe!.getTime() - a.epingleeLe!.getTime() || b.conversationId - a.conversationId)
        .flatMap((m) => {
          const c = tables.conversations.get(m.conversationId);
          return c ? [versConversation(c)] : [];
        });
    },
    async compterEpinglees(compteId) {
      return tables.membres.filter((m) => m.compteId === compteId && m.epingleeLe !== null).length;
    },
    async lireAccusesLecture(compteIds) {
      return new Set(compteIds.filter((id) => tables.profils.get(id)?.accusesLecture === true));
    },

    async lireInvitations(conversationIds) {
      const ids = new Set(conversationIds);
      return tables.invitationsGroupes.filter((i) => ids.has(i.conversationId)).sort((a, b) => a.creeLe.getTime() - b.creeLe.getTime() || a.compteId - b.compteId).map(versInvitation);
    },
    async listerMesInvitations(compteId, nombre) {
      return tables.invitationsGroupes
        .filter((i) => i.compteId === compteId && i.statut === "invite")
        .sort((a, b) => b.creeLe.getTime() - a.creeLe.getTime() || b.conversationId - a.conversationId)
        .slice(0, nombre)
        .map(versInvitation);
    },
    async creerInvitations(lignes) {
      for (const l of lignes) {
        if (!tables.invitationsGroupes.some((i) => i.conversationId === l.conversationId && i.compteId === l.compteId)) tables.invitationsGroupes.push({ ...l });
      }
    },
    async refuserInvitation(conversationId, compteId, maintenant) {
      const i = tables.invitationsGroupes.find((x) => x.conversationId === conversationId && x.compteId === compteId && x.statut === "invite");
      if (i) Object.assign(i, { statut: "refuse", reponduLe: maintenant });
    },
    async supprimerInvitation(conversationId, compteId) {
      return retirer(tables.invitationsGroupes, (i) => i.conversationId === conversationId && i.compteId === compteId) > 0;
    },

    async lireDeparts(conversationId, depuis) {
      return new Set(tables.departs.filter((d) => d.conversationId === conversationId && d.partiLe.getTime() > depuis.getTime()).map((d) => d.compteId));
    },
    async noterDepart(conversationId, compteId, maintenant) {
      const d = tables.departs.find((x) => x.conversationId === conversationId && x.compteId === compteId);
      if (d) d.partiLe = maintenant;
      else tables.departs.push({ conversationId, compteId, partiLe: maintenant });
    },
    async oublierDepart(conversationId, compteId) {
      retirer(tables.departs, (d) => d.conversationId === conversationId && d.compteId === compteId);
    },

    async lireMessage(id) {
      const m = tables.messages.get(id);
      return m ? versMessage(m) : null;
    },
    async lireMessages(ids) {
      return new Map(ids.flatMap((id) => {
        const m = tables.messages.get(id);
        return m ? [[id, versMessage(m)] as const] : [];
      }));
    },
    async lireMessageParIdClient(conversationId, idClient) {
      const m = messagesDe(conversationId).find((x) => x.idClient === idClient);
      return m ? versMessage(m) : null;
    },
    async listerMessages(conversationId, f, avant, nombre) {
      return messagesDe(conversationId)
        .filter((m) => m.id > f.apres && (avant === null || m.id < avant) && estVisible(m, f))
        .sort((a, b) => b.id - a.id)
        .slice(0, nombre)
        .map(versMessage);
    },
    async listerAlbum(conversationId, album, nombre) {
      return messagesDe(conversationId).filter((m) => m.album === album).sort((a, b) => a.id - b.id).slice(0, nombre).map(versMessage);
    },
    async listerPartages(conversationId, type, f, avant, nombre, maintenant) {
      return messagesDe(conversationId)
        .filter((m) => m.type === type && !m.supprimeLe && !m.suspenduLe && !m.retireLe
          && (type !== "photo" || (m.fichier !== null && (m.mediaExpireLe?.getTime() ?? 0) > maintenant.getTime())))
        .filter((m) => m.id > f.apres && (avant === null || m.id < avant) && estVisible(m, f))
        .sort((a, b) => b.id - a.id)
        .slice(0, nombre)
        .map(versMessage);
    },
    async lireDerniersMessages(conversations, caches, exclus, sansSystemes = false) {
      return new Map(conversations.flatMap(({ id, apres }) => {
        const [dernier] = messagesDe(id).filter((m) => m.id > apres && estVisible(m, { caches, exclus, sansSystemes })).sort((a, b) => b.id - a.id);
        return dernier ? [[id, versMessage(dernier)] as const] : [];
      }));
    },
    async lireDerniersIds(conversationIds) {
      return new Map(conversationIds.flatMap((id) => {
        const ids = messagesDe(id).map((m) => m.id);
        return ids.length > 0 ? [[id, Math.max(...ids)] as const] : [];
      }));
    },
    async compterNonLus(compteId, conversations, caches, max) {
      return new Map(conversations.map(({ id, depuis }) => [id, Math.min(max, messagesDe(id).filter((m) =>
        m.id > depuis && m.auteurId !== compteId && !m.supprimeLe && !m.suspenduLe && !m.retireLe && (m.auteurId === null || !caches.has(m.auteurId))).length)]));
    },
    async insererMessage(m) {
      if (messagesDe(m.conversationId).some((x) => x.idClient === m.idClient)) return null;
      const id = prendreId(tables, "messages");
      const ligne: MessageConversation = { ...m, id };
      tables.messages.set(id, ligne);
      return versMessage(ligne);
    },
    async modifierMessage(id, m) {
      const ligne = tables.messages.get(id);
      if (ligne) Object.assign(ligne, m);
    },
    async lireMessagesSignales(compteId) {
      return new Set([...tables.signalements.values()].filter((s) => s.signaleParId === compteId && s.cible === "message").map((s) => Number(s.cibleId)));
    },

    async lireReactions(messageIds) {
      const ids = new Set(messageIds);
      return tables.reactions.filter((r) => ids.has(r.messageId)).map((r) => ({ messageId: r.messageId, compteId: r.compteId, reaction: r.reaction as CodeReaction }));
    },
    async basculerReaction(messageId, compteId, reaction, oui, maintenant) {
      const i = tables.reactions.findIndex((r) => r.messageId === messageId && r.compteId === compteId && r.reaction === reaction);
      if (oui === (i >= 0)) return false;
      if (oui) tables.reactions.push({ messageId, compteId, reaction, creeLe: maintenant });
      else tables.reactions.splice(i, 1);
      return true;
    },

    async compterMedias(compteId, depuis) {
      const medias = [...tables.messages.values()].filter((m) => m.type === "photo" || m.type === "vocal");
      const somme = (lignes: MessageConversation[]) => lignes.reduce((total, m) => total + (m.taille ?? 0), 0);
      return {
        envoisCompte24h: medias.filter((m) => m.auteurId === compteId && m.creeLe.getTime() >= depuis.getTime()).length,
        octetsCompte: somme(medias.filter((m) => m.auteurId === compteId && m.fichier !== null)),
        octetsServeur24h: somme(medias.filter((m) => (m.mediaExpireLe?.getTime() ?? 0) >= depuis.getTime() + DUREE_MEDIAS_MS)),
      };
    },
    async estLieuPublie(lieuId) {
      return tables.lieux.get(lieuId)?.statut === "publie";
    },
    async listerLieuxEnvoyes(moi, sens, f, apres, nombre) {
      return lieuxDesPrives(moi, f.caches)
        .filter((m) => (sens === "recus"
          ? m.auteurId !== moi && !tables.masques.some((x) => x.compteId === moi && x.cible === "lieu-recu" && x.cibleId === String(m.id))
          : m.auteurId === moi) && estVisible(m, f))
        .filter((m) => !apres || m.creeLe.getTime() < apres.date.getTime() || (m.creeLe.getTime() === apres.date.getTime() && m.id < apres.id))
        .sort(plusRecentDabord)
        .slice(0, nombre)
        .map((m) => ({ message: versMessage(m), autreId: tables.membres.find((o) => o.conversationId === m.conversationId && o.compteId !== moi)?.compteId ?? null }));
    },
    async lireDernierLieuRecu(moi, jusqua, caches) {
      const ids = lieuxDesPrives(moi, caches).filter((m) => m.auteurId !== moi && (m.auteurId === null || !caches.has(m.auteurId)) && m.id <= jusqua).map((m) => m.id);
      return ids.length > 0 ? Math.max(...ids) : null;
    },
    async lireLieuxVus(compteId) {
      return tables.profils.get(compteId)?.lieuxRecusVusJusqua ?? 0;
    },
    async ecrireLieuxVus(compteId, jusqua) {
      const profil = tables.profils.get(compteId);
      if (profil) profil.lieuxRecusVusJusqua = Math.max(profil.lieuxRecusVusJusqua, jusqua);
    },

    async listerPotesParmi(compteId, ids) {
      const parmi = new Set(ids);
      return new Set(tables.bande.filter((b) => b.compteId === compteId && parmi.has(b.poteId)).map((b) => b.poteId));
    },
    bloqueEntre: (a, b) => relations.bloqueEntre(a, b),
    verrouillerComptes: async () => {},
    lireIdempotence: (compteId, cle) => relations.lireIdempotence(compteId, cle, "groupe"),
    noterIdempotence: (compteId, cle, conversationId, maintenant) => relations.noterIdempotence(compteId, cle, "groupe", conversationId, maintenant),
  };
}

/**
 * Le dépôt en mémoire : mêmes gestes pour lire et écrire. Les écritures passent l'une après l'autre (comme les verrous de la
 * base : deux envois simultanés ne dépassent jamais un quota) ; les fichiers qu'un signalement garde restent (ouvert, ou
 * jugé depuis moins de 183 jours, comme la base).
 */
export function creerDepotMessagerieEnMemoire(tables: TablesSociales, relations: RelationsSociales, medias: StockageMediasChat): DepotMessagerie {
  const t = creerTablesMessagerieEnMemoire(tables, relations, medias);
  let file: Promise<unknown> = Promise.resolve();
  return {
    lire: t,
    ecrire: (geste) => {
      const tour = file.then(() => geste(t));
      file = tour.catch(() => undefined);
      return tour;
    },
    supprimerFichiers: async (fichiers) => {
      const gardes = lireFichiersGardesEnMemoire(tables);
      return medias.supprimer(fichiers.filter((f) => !gardes.has(f))).catch(() => 0);
    },
  };
}
