// Export « Télécharger mes données sociales » (GET /app/social/export, spécification sociale B.1 ; droit d'accès et de
// portabilité du RGPD), fait par la personne elle-même depuis l'app : l'équipe ne lit jamais ses messages pour l'exporter.
// Contrat commun du service Prisma (export-social.ts) et de son double en mémoire (export-social-en-memoire.ts) : chacun lit
// les lignes de la personne (DonneesExportSocial), puis assemblerExportSocial, écrit une fois ici, les met en forme.
// Dedans : TES données sociales et TES messages déchiffrés. Jamais les messages des autres, jamais ton code d'invitation, ni
// ce qui révélerait un refus silencieux d'un autre (une demande refusée se lit comme envoyée) ou ce qu'il ne t'a pas montré.
// Choix de construction (à confirmer par Hugo, B.1) : les photos et notes vocales ne sont pas jointes (date, type, taille).
import { CIBLES_SIGNALEMENT_SOCIAL } from "../../../../packages/commun/src/regles/signalement.ts";
import type { TypeCloche } from "../../../../packages/commun/src/types/cloche.ts";
import type { ExportSocialApi } from "../../../../packages/commun/src/types/export-social.ts";
import type { CodeReaction, TypeConversation } from "../../../../packages/commun/src/types/messagerie.ts";
import type { CibleSignalementSocial } from "../../../../packages/commun/src/types/signalement.ts";
import type { CibleMasque, PersonneResume } from "../../../../packages/commun/src/types/social.ts";
import type {
  CommentairePublication, Conversation, DemandeBande, ElementMasque, InvitationGroupe, LieuDeListe, ListeLieux, MembreBande,
  MembreConversation, MessageConversation, NotificationCloche, ProfilSocial, ReactionMessage, Signalement, Sortie, SuiviPersonne,
} from "../base-de-donnees/client-genere/client.ts";
import type { ChiffrementSocial } from "./chiffrement-social.ts";
import type { RelationsSociales } from "./relations-sociales-regles.ts";

export interface ServicesExportSocial {
  /** Déchiffre TES messages et les titres de tes groupes ; jamais les messages des autres ni ton code d'invitation */
  exporter(compteId: number, maintenant: Date): Promise<ExportSocialApi>;
}

/** Les lignes d'une personne, telles que la base (ou le double) les rend ; rien n'est encore déchiffré ni présenté */
export type DonneesExportSocial = {
  profil: Pick<ProfilSocial, "trouvable" | "suggerable" | "activitePartagee" | "pushSocial" | "creeLe"> | null;
  bande: Pick<MembreBande, "poteId" | "creeLe">[];
  demandesEnvoyees: Pick<DemandeBande, "aId" | "creeLe">[];
  /** Celles que tu n'as pas refusées (comme dans l'app) */
  demandesRecues: Pick<DemandeBande, "deId" | "creeLe">[];
  /** Ceux que TU as bloqués (jamais ceux qui t'ont bloqué) */
  bloques: number[];
  /** Tes suivis (acceptés, ou en attente : un refus, silencieux, se lit comme une demande en attente) */
  abonnements: Pick<SuiviPersonne, "suiviId" | "creeLe" | "accepteLe">[];
  /** Ceux qui te suivent (acceptés) */
  abonnes: Pick<SuiviPersonne, "suiveurId" | "creeLe" | "accepteLe">[];
  /** Les conversations dont tu es membre, celles où restent tes messages, et celles où l'on t'invite ; sortie : son titre */
  conversations: (Pick<Conversation, "id" | "type" | "titreChiffre"> & { titreSortie: string | null })[];
  /** Les membres des conversations dont tu es membre (et seulement celles-là) */
  membres: Pick<MembreConversation, "conversationId" | "compteId">[];
  /** TES messages, et seulement les tiens */
  messages: Pick<MessageConversation, "id" | "conversationId" | "type" | "idClient" | "texteChiffre" | "taille" | "creeLe">[];
  invitationsGroupes: Pick<InvitationGroupe, "conversationId" | "statut" | "creeLe">[];
  reactions: Pick<ReactionMessage, "messageId" | "reaction" | "creeLe">[];
  /** Les sorties que tu organises ou où l'on t'invite ; tes invitations, tes propositions et tes votes (lieu par sortie) */
  sorties: Pick<Sortie, "id" | "titre" | "quand" | "organisateurId">[];
  invitationsSorties: { sortieId: number; statut: string }[];
  propositions: { sortieId: number; lieuId: number }[];
  votes: { sortieId: number; lieuId: number }[];
  /** Tes listes, celles que tu remplis avec leur auteur (co-auteur accepté) et celles que tu suis ; leurs lieux */
  listes: Pick<ListeLieux, "id" | "titre" | "auteurId">[];
  coAuteur: number[];
  abonnementsListes: number[];
  lieuxListes: Pick<LieuDeListe, "listeId" | "lieuId" | "ajouteParId">[];
  commentaires: Pick<CommentairePublication, "id" | "publicationId" | "texte" | "creeLe">[];
  jaimesCommentaires: number[];
  cloche: Pick<NotificationCloche, "id" | "type" | "creeLe">[];
  signalements: Pick<Signalement, "id" | "cible" | "raison" | "statut" | "creeLe">[];
  masques: Pick<ElementMasque, "cible" | "cibleId" | "creeLe">[];
};

const iso = (d: Date) => d.toISOString();
const parDate = <T extends { creeLe: Date }>(a: T, b: T) => a.creeLe.getTime() - b.creeLe.getTime();
const estCibleSociale = (cible: string): cible is CibleSignalementSocial => (CIBLES_SIGNALEMENT_SOCIAL as readonly string[]).includes(cible);

/** Le texte (ou le mot et le lieu d'un lieu envoyé) d'un de TES messages ; null partout s'il ne se relit pas, ou plus */
function lireMonMessage(chiffrement: ChiffrementSocial, m: DonneesExportSocial["messages"][number]): { texte: string | null; lieuId: number | null } {
  if (!m.texteChiffre || (m.type !== "texte" && m.type !== "lieu")) return { texte: null, lieuId: null };
  try {
    const clair = chiffrement.dechiffrerMessage(m.texteChiffre, m.conversationId, m.idClient);
    if (m.type === "texte") return { texte: clair, lieuId: null };
    const lu: unknown = JSON.parse(clair);
    const { l, m: mot } = (typeof lu === "object" && lu !== null ? lu : {}) as { l?: unknown; m?: unknown };
    return { texte: typeof mot === "string" ? mot : null, lieuId: typeof l === "number" && Number.isSafeInteger(l) ? l : null };
  } catch {
    return { texte: null, lieuId: null };
  }
}

/** Le titre d'un groupe, déchiffré (null s'il ne se relit pas) ; celui de la sortie ; null pour un privé */
function lireTitre(chiffrement: ChiffrementSocial, c: DonneesExportSocial["conversations"][number]): string | null {
  if (c.type === "sortie") return c.titreSortie;
  if (c.type !== "groupe" || !c.titreChiffre) return null;
  try {
    return chiffrement.dechiffrerTitre(c.titreChiffre, c.id);
  } catch {
    return null;
  }
}

/** Les lignes d'une personne mises en forme (ExportSocialApi), dans l'ordre chronologique */
export async function assemblerExportSocial(
  d: DonneesExportSocial, o: { compteId: number; relations: Pick<RelationsSociales, "presenter">; chiffrement: ChiffrementSocial; maintenant: Date },
): Promise<ExportSocialApi> {
  const { compteId, chiffrement } = o;
  const mesConversations = new Set(d.membres.filter((m) => m.compteId === compteId).map((m) => m.conversationId));
  const personnes = await o.relations.presenter([
    compteId, ...d.bande.map((b) => b.poteId), ...d.demandesEnvoyees.map((x) => x.aId), ...d.demandesRecues.map((x) => x.deId), ...d.bloques,
    ...d.abonnements.map((s) => s.suiviId), ...d.abonnes.map((s) => s.suiveurId), ...d.membres.map((m) => m.compteId),
  ]);
  const personne = (id: number) => personnes.get(id);
  const avecPersonne = <T>(id: number, faire: (p: PersonneResume) => T): T[] => {
    const p = personne(id);
    return p ? [faire(p)] : [];
  };
  const moi = personne(compteId);
  const conversations = [...d.conversations].sort((a, b) => a.id - b.id);
  const sorties = [...d.sorties].sort((a, b) => a.quand.getTime() - b.quand.getTime() || a.id - b.id);
  const lieuxDe = (listeId: number, seulementMiens: boolean) =>
    d.lieuxListes.filter((l) => l.listeId === listeId && (!seulementMiens || l.ajouteParId === compteId)).map((l) => l.lieuId).sort((a, b) => a - b);

  return {
    genereLe: iso(o.maintenant),
    profil: d.profil && moi ? {
      personne: moi,
      reglages: { trouvable: d.profil.trouvable, suggerable: d.profil.suggerable, activitePartagee: d.profil.activitePartagee, pushSocial: d.profil.pushSocial },
      creeLe: iso(d.profil.creeLe),
    } : null,
    bande: [...d.bande].sort(parDate).flatMap((b) => avecPersonne(b.poteId, (p) => ({ personne: p, depuis: iso(b.creeLe) }))),
    demandesBande: {
      envoyees: [...d.demandesEnvoyees].sort(parDate).flatMap((x) => avecPersonne(x.aId, (p) => ({ personne: p, date: iso(x.creeLe) }))),
      recues: [...d.demandesRecues].sort(parDate).flatMap((x) => avecPersonne(x.deId, (p) => ({ personne: p, date: iso(x.creeLe) }))),
    },
    bloques: d.bloques.flatMap((id) => avecPersonne(id, (p) => p)),
    suivis: {
      abonnements: [...d.abonnements].sort(parDate).flatMap((s) => avecPersonne(s.suiviId, (p) => ({ personne: p, depuis: iso(s.accepteLe ?? s.creeLe) }))),
      abonnes: [...d.abonnes].sort(parDate).flatMap((s) => avecPersonne(s.suiveurId, (p) => ({ personne: p, depuis: iso(s.accepteLe ?? s.creeLe) }))),
    },
    conversations: conversations.flatMap((c) => {
      const messages = d.messages.filter((m) => m.conversationId === c.id).sort((a, b) => a.id - b.id);
      const membre = mesConversations.has(c.id);
      if (!membre && messages.length === 0) return [];
      return [{
        id: String(c.id),
        type: c.type as TypeConversation,
        // Une conversation quittée où restent tes messages : ni son titre, ni ses membres (tu n'en fais plus partie)
        titre: membre ? lireTitre(chiffrement, c) : null,
        membres: membre ? d.membres.filter((m) => m.conversationId === c.id).flatMap((m) => avecPersonne(m.compteId, (p) => p.pseudo)) : [],
        messages: messages.map((m) => ({
          date: iso(m.creeLe),
          type: m.type as "texte" | "lieu" | "photo" | "vocal",
          ...lireMonMessage(chiffrement, m),
          taille: m.type === "photo" || m.type === "vocal" ? m.taille : null,
        })),
      }];
    }),
    invitationsGroupes: [...d.invitationsGroupes].sort(parDate).flatMap((i) => {
      const c = d.conversations.find((x) => x.id === i.conversationId);
      const statut = i.statut === "refuse" ? "refuse" : "invite";
      return [{ titre: c ? lireTitre(chiffrement, c) : null, date: iso(i.creeLe), statut }];
    }),
    reactions: [...d.reactions].sort(parDate).map((r) => ({ messageId: String(r.messageId), reaction: r.reaction as CodeReaction, date: iso(r.creeLe) })),
    sorties: sorties.flatMap((s) => {
      const statut = d.invitationsSorties.find((i) => i.sortieId === s.id)?.statut;
      // Choix de construction : une invitation que tu as refusée n'y est pas (le contrat n'a pas de rôle « refusé »)
      const role = s.organisateurId === compteId ? "organisateur" : statut === "accepte" ? "participant" : statut === "invite" ? "invite" : null;
      if (!role) return [];
      const lieux = (l: { sortieId: number; lieuId: number }[]) => l.filter((x) => x.sortieId === s.id).map((x) => x.lieuId).sort((a, b) => a - b);
      return [{ titre: s.titre, quand: iso(s.quand), role, propositions: lieux(d.propositions), votes: lieux(d.votes) }];
    }),
    listes: [...d.listes].sort((a, b) => a.id - b.id).flatMap((l) => [
      ...(l.auteurId === compteId ? [{ titre: l.titre, role: "auteur" as const, lieux: lieuxDe(l.id, false) }] : []),
      // Co-auteur : les lieux que TU as ajoutés ; abonné : le titre seulement (les lieux sont à son auteur, qui peut la fermer)
      ...(d.coAuteur.includes(l.id) ? [{ titre: l.titre, role: "co-auteur" as const, lieux: lieuxDe(l.id, true) }] : []),
      ...(d.abonnementsListes.includes(l.id) ? [{ titre: l.titre, role: "abonne" as const, lieux: [] }] : []),
    ]),
    commentaires: [...d.commentaires].sort((a, b) => a.id - b.id).map((c) => ({ publicationId: String(c.publicationId), texte: c.texte, date: iso(c.creeLe) })),
    jaimesCommentaires: [...d.jaimesCommentaires].sort((a, b) => a - b).map(String),
    cloche: [...d.cloche].sort((a, b) => a.id - b.id).map((n) => ({ type: n.type as TypeCloche, date: iso(n.creeLe) })),
    signalements: [...d.signalements].sort((a, b) => a.id - b.id).flatMap((s) =>
      estCibleSociale(s.cible) ? [{ cible: s.cible, raison: s.raison, date: iso(s.creeLe), statut: s.statut }] : []),
    masques: [...d.masques].sort(parDate).map((m) => ({ cible: m.cible as CibleMasque, cibleId: m.cibleId })),
  };
}

/** Le service, posé sur une façon de lire les lignes (la base, ou les tables en mémoire) */
export function creerServicesExportSocial(o: {
  lire: (compteId: number) => Promise<DonneesExportSocial>;
  relations: Pick<RelationsSociales, "presenter">;
  chiffrement: ChiffrementSocial | null;
}): ServicesExportSocial {
  return {
    async exporter(compteId, maintenant) {
      // La route passe par exigerChiffrementSocial : sans clé, c'est une erreur de branchement (500), jamais un export vide
      if (!o.chiffrement) throw new Error("Chiffrement social absent : export sans exigerChiffrementSocial");
      return assemblerExportSocial(await o.lire(compteId), { compteId, relations: o.relations, chiffrement: o.chiffrement, maintenant });
    },
  };
}
