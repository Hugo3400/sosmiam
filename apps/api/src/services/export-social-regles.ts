// Export « Télécharger mes données sociales » (GET /app/social/export, spécification sociale B.1 ; droit d'accès et de
// portabilité du RGPD), fait par la personne elle-même depuis l'app : l'équipe ne lit jamais ses messages pour l'exporter.
// Contrat commun du service Prisma (export-social.ts) et de son double en mémoire (export-social-en-memoire.ts) : chacun lit
// les lignes de la personne (DonneesExportSocial), puis assemblerExportSocial, écrit une fois ici, les met en forme.
// Dedans : TES données sociales et TES messages déchiffrés. Jamais les messages des autres, jamais ton code d'invitation, ni
// ce qui révélerait un refus silencieux d'un autre (une demande refusée se lit comme envoyée) ou ce qu'il ne t'a pas montré :
// - personne avec qui il y a un blocage, dans un sens ou dans l'autre, n'est nommé (bande, demandes, suivis, membres des
//   conversations ; un privé garde tes messages, avec toi seul en membre), sauf dans « bloques » (ceux que TU as bloqués,
//   comme Réglages › Personnes bloquées). Les blocages sont lus une seule fois (relations.listerBlocages) ;
// - le titre d'une liste suivie ou co-écrite seulement si elle t'est encore visible (même règle que filtrerVisibles de
//   listes.ts et voit de listes-en-memoire.ts) ; celui d'un groupe seulement si tu en es membre ou invité (pas après un
//   refus) ; une invitation à une sortie qu'un blocage te cache n'y est pas (estInvitationCachee, comme l'app), ni une
//   sortie que tu as quittée (même si tu l'avais créée) ; « organisateur » : tu as la main (trouverOrganisateurEffectif) ;
// - de tes signalements, ce que TU as écrit (raison, précision, explication) et leur statut ; jamais la décision, sa
//   motivation, une contestation ni l'instantané du contenu ;
// - les limitations de TON compte (listerLimitations, session Site : limitations-comptes.ts) : motif, motivation, dates et
//   ta contestation ; jamais qui a décidé ou réexaminé (la table ne le garde pas, le journal du logiciel suffit).
// Les messages se déchiffrent par paquets (PAQUET_DECHIFFREMENT) : entre deux paquets, l'API répond aux autres demandes.
// Choix de construction (à confirmer par Hugo, B.1) : les photos et notes vocales ne sont pas jointes (date, type, taille).
import { peutVoirListe } from "../../../../packages/commun/src/fonctions/social/peut-voir-liste.ts";
import { calculerNiveauProfil } from "../../../../packages/commun/src/regles/calculer-niveau-profil.ts";
import { CIBLES_SIGNALEMENT_SOCIAL } from "../../../../packages/commun/src/regles/signalement.ts";
import type { TypeCloche } from "../../../../packages/commun/src/types/cloche.ts";
import type { ExportSocialApi } from "../../../../packages/commun/src/types/export-social.ts";
import type { CodeReaction, TypeConversation } from "../../../../packages/commun/src/types/messagerie.ts";
import type { CibleSignalementSocial } from "../../../../packages/commun/src/types/signalement.ts";
import type { CibleMasque, PersonneResume } from "../../../../packages/commun/src/types/social.ts";
import type {
  CommentairePublication, Conversation, DemandeBande, ElementMasque, InvitationGroupe, InvitationSortie, LieuDeListe, ListeLieux,
  MembreBande, MembreConversation, MessageConversation, NotificationCloche, ProfilSocial, ReactionMessage, Signalement, Sortie,
  SuiviPersonne,
} from "../base-de-donnees/client-genere/client.ts";
import { trouverOrganisateurEffectif } from "../fonctions/social/trouver-organisateur-effectif.ts";
import type { ChiffrementSocial } from "./chiffrement-social.ts";
import type { LimitationLue } from "./limitations-comptes-regles.ts";
import { AUCUN_LIEN, type RelationsSociales } from "./relations-sociales-regles.ts";
import { estInvitationCachee } from "./sorties-regles.ts";

export interface ServicesExportSocial {
  /** Déchiffre TES messages et les titres de tes groupes ; jamais les messages des autres ni ton code d'invitation */
  exporter(compteId: number, maintenant: Date): Promise<ExportSocialApi>;
}

/** Ce que l'export lit des relations : les personnes en petit, les blocages (une fois) et tes liens avec les auteurs de listes */
export type RelationsExportSocial = Pick<RelationsSociales, "presenter" | "listerBlocages" | "lireLiens">;

/** Ce que l'export lit d'une limitation de ton compte : jamais le compte de l'équipe (la table ne le garde pas) */
export type LimitationExportLue = Pick<
  LimitationLue, "id" | "motif" | "motivation" | "debut" | "fin" | "leveeLe" | "contestation" | "contesteLe" | "reexamineLe" | "creeLe"
>;

/** Toutes les limitations encore gardées d'un compte (listerLimitationsDuCompte de limitations-comptes.ts, ou son double) */
export type ListerLimitationsExport = (compteId: number) => Promise<LimitationExportLue[]>;

/** Les lignes d'une personne, telles que la base (ou le double) les rend ; rien n'est encore déchiffré, filtré ni présenté */
export type DonneesExportSocial = {
  profil: Pick<ProfilSocial, "trouvable" | "suggerable" | "activitePartagee" | "pushSocial" | "creeLe"> | null;
  bande: Pick<MembreBande, "poteId" | "creeLe">[];
  demandesEnvoyees: Pick<DemandeBande, "aId" | "creeLe">[];
  /** Celles que tu n'as pas refusées (comme dans l'app) */
  demandesRecues: Pick<DemandeBande, "deId" | "creeLe">[];
  /** Tes suivis : acceptés, en attente, ou refusés (un refus, silencieux, se rend comme une demande en attente) */
  abonnements: Pick<SuiviPersonne, "suiviId" | "statut" | "creeLe" | "accepteLe">[];
  /** Ceux qui te suivent (acceptés) */
  abonnes: Pick<SuiviPersonne, "suiveurId" | "creeLe" | "accepteLe">[];
  /** Les demandes de suivi reçues qui attendent ta réponse (« demande ») */
  demandesSuiviRecues: Pick<SuiviPersonne, "suiveurId" | "creeLe">[];
  /** Les conversations dont tu es membre, celles où restent tes messages, et celles où l'on t'invite ; sortie : son titre */
  conversations: (Pick<Conversation, "id" | "type" | "titreChiffre"> & { titreSortie: string | null })[];
  /** Les membres des conversations dont tu es membre (et seulement celles-là), par ordre d'arrivée */
  membres: Pick<MembreConversation, "conversationId" | "compteId">[];
  /** TES messages, et seulement les tiens */
  messages: Pick<MessageConversation, "id" | "conversationId" | "type" | "idClient" | "texteChiffre" | "taille" | "creeLe">[];
  invitationsGroupes: Pick<InvitationGroupe, "conversationId" | "inviteParId" | "statut" | "creeLe">[];
  reactions: Pick<ReactionMessage, "messageId" | "reaction" | "creeLe">[];
  /** Les sorties où tu as une invitation (pas celles que tu as quittées) ; tes invitations, propositions et votes (lieu par sortie) */
  sorties: Pick<Sortie, "id" | "titre" | "quand" | "organisateurId">[];
  invitationsSorties: Pick<InvitationSortie, "sortieId" | "statut" | "inviteParId">[];
  /** Les participants (invitations « accepte ») des sorties où ton invitation attend ta réponse ou est acceptée : qui y a la main */
  participantsSorties: Pick<InvitationSortie, "sortieId" | "compteId" | "creeLe" | "reponduLe">[];
  propositions: { sortieId: number; lieuId: number }[];
  votes: { sortieId: number; lieuId: number }[];
  /** Tes listes, celles que tu remplis avec leur auteur (co-auteur accepté) et celles que tu suis ; leurs lieux */
  listes: (Pick<ListeLieux, "id" | "titre" | "auteurId" | "visibilite" | "suspendueLe" | "retireeLe"> & { auteurPrive: boolean })[];
  coAuteur: number[];
  abonnementsListes: number[];
  lieuxListes: Pick<LieuDeListe, "listeId" | "lieuId" | "ajouteParId">[];
  commentaires: Pick<CommentairePublication, "id" | "publicationId" | "texte" | "creeLe">[];
  jaimesCommentaires: number[];
  cloche: Pick<NotificationCloche, "id" | "type" | "creeLe">[];
  /** Tes signalements ; cibleId ne sert qu'à cacher une liste que tu as signalée (il ne sort pas) */
  signalements: Pick<Signalement, "id" | "cible" | "cibleId" | "raison" | "precision" | "explication" | "statut" | "creeLe">[];
  masques: Pick<ElementMasque, "cible" | "cibleId" | "creeLe">[];
  /** Les limitations de ton compte ; absent : l'export ne les lit pas (listerLimitations pas branché) */
  limitations?: LimitationExportLue[];
};

/** Des lignes déchiffrées d'un coup, au plus : déchiffrer est synchrone, et des dizaines de milliers de messages gèleraient l'API */
export const PAQUET_DECHIFFREMENT = 2_000;

const iso = (d: Date) => d.toISOString();
const isoOuNull = (d: Date | null) => (d ? iso(d) : null);
const parDate = <T extends { creeLe: Date }>(a: T, b: T) => a.creeLe.getTime() - b.creeLe.getTime();
const estCibleSociale = (cible: string): cible is CibleSignalementSocial => (CIBLES_SIGNALEMENT_SOCIAL as readonly string[]).includes(cible);
/** Rend la main à la boucle de Node : les demandes en attente passent avant le paquet suivant */
const laisserPasser = () => new Promise<void>((suite) => setImmediate(suite));

/** Les lignes rangées par clé (une conversation, une sortie, une liste), dans leur ordre */
function grouper<T, K>(lignes: readonly T[], cle: (ligne: T) => K): Map<K, T[]> {
  const groupes = new Map<K, T[]>();
  for (const ligne of lignes) {
    const groupe = groupes.get(cle(ligne));
    if (groupe) groupe.push(ligne);
    else groupes.set(cle(ligne), [ligne]);
  }
  return groupes;
}

/** `lire` sur chaque ligne, PAQUET_DECHIFFREMENT à la fois, en laissant passer les autres demandes entre deux paquets */
async function lireParPaquets<T, R>(lignes: readonly T[], lire: (ligne: T) => R): Promise<R[]> {
  const lus: R[] = [];
  for (let debut = 0; debut < lignes.length; debut += PAQUET_DECHIFFREMENT) {
    if (debut > 0) await laisserPasser();
    for (const ligne of lignes.slice(debut, debut + PAQUET_DECHIFFREMENT)) lus.push(lire(ligne));
  }
  return lus;
}

/** Le texte (ou le mot et le lieu d'un lieu envoyé, ou le petit mot d'une photo) d'un de TES messages ; null partout s'il ne se relit pas, ou plus */
function lireMonMessage(chiffrement: ChiffrementSocial, m: DonneesExportSocial["messages"][number]): { texte: string | null; lieuId: number | null } {
  if (!m.texteChiffre || (m.type !== "texte" && m.type !== "lieu" && m.type !== "photo")) return { texte: null, lieuId: null };
  try {
    const clair = chiffrement.dechiffrerMessage(m.texteChiffre, m.conversationId, m.idClient);
    if (m.type !== "lieu") return { texte: clair, lieuId: null };
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
  d: DonneesExportSocial, o: { compteId: number; relations: RelationsExportSocial; chiffrement: ChiffrementSocial; maintenant: Date },
): Promise<ExportSocialApi> {
  const { compteId, chiffrement } = o;
  const coAuteur = new Set(d.coAuteur);
  const abonneListes = new Set(d.abonnementsListes);
  const auteursSuivis = d.listes.filter((l) => l.auteurId !== compteId && (coAuteur.has(l.id) || abonneListes.has(l.id))).map((l) => l.auteurId);
  const [{ parMoi, caches }, liensAuteurs] = await Promise.all([o.relations.listerBlocages(compteId), o.relations.lireLiens(compteId, auteursSuivis)]);
  const personnes = await o.relations.presenter([
    compteId, ...d.bande.map((b) => b.poteId), ...d.demandesEnvoyees.map((x) => x.aId), ...d.demandesRecues.map((x) => x.deId), ...parMoi,
    ...d.abonnements.map((s) => s.suiviId), ...d.abonnes.map((s) => s.suiveurId), ...d.demandesSuiviRecues.map((s) => s.suiveurId),
    ...d.membres.map((m) => m.compteId),
  ]);
  /** Une personne nommée, si aucun blocage ne la cache (toi, toujours) ; [] sinon, ou sans profil social */
  const nommer = <T>(id: number, faire: (p: PersonneResume) => T): T[] => {
    const p = id === compteId || !caches.has(id) ? personnes.get(id) : undefined;
    return p ? [faire(p)] : [];
  };
  const moi = personnes.get(compteId);

  // Conversations : messages et membres rangés par conversation, puis messages et titres déchiffrés par paquets
  const conversations = [...d.conversations].sort((a, b) => a.id - b.id);
  const membresDe = grouper(d.membres, (m) => m.conversationId);
  const messagesDe = grouper([...d.messages].sort((a, b) => a.id - b.id), (m) => m.conversationId);
  const mesConversations = new Set(d.membres.filter((m) => m.compteId === compteId).map((m) => m.conversationId));
  const invitationLisible = (i: DonneesExportSocial["invitationsGroupes"][number]) =>
    i.statut === "invite" && (i.inviteParId === null || !caches.has(i.inviteParId));
  const aTitrer = new Set([...mesConversations, ...d.invitationsGroupes.filter(invitationLisible).map((i) => i.conversationId)]);
  const titres = new Map(await lireParPaquets(conversations.filter((c) => aTitrer.has(c.id)), (c) => [c.id, lireTitre(chiffrement, c)] as const));
  const contenus = new Map(await lireParPaquets(d.messages, (m) => [m.id, lireMonMessage(chiffrement, m)] as const));

  // Sorties : ton invitation, les participants (qui a la main), tes propositions et tes votes, rangés par sortie
  const invitationSortie = new Map(d.invitationsSorties.map((i) => [i.sortieId, i]));
  const participantsDe = grouper(d.participantsSorties, (p) => p.sortieId);
  const propositionsDe = grouper(d.propositions, (p) => p.sortieId);
  const votesDe = grouper(d.votes, (v) => v.sortieId);
  const lieuxDeSortie = (groupes: Map<number, { lieuId: number }[]>, sortieId: number) => (groupes.get(sortieId) ?? []).map((x) => x.lieuId).sort((a, b) => a - b);

  // Listes : la règle de B.5, comme filtrerVisibles (listes.ts) et voit (listes-en-memoire.ts)
  const lieuxDeListe = grouper(d.lieuxListes, (l) => l.listeId);
  const signaleesParMoi = new Set(d.signalements.filter((s) => s.cible === "liste").map((s) => s.cibleId));
  const visible = (l: DonneesExportSocial["listes"][number]): boolean => {
    if (l.auteurId === compteId) return true;
    const lien = liensAuteurs.get(l.auteurId) ?? AUCUN_LIEN;
    if (caches.has(l.auteurId) || lien.bloqueParMoi || lien.mABloque) return false;
    if (l.suspendueLe || l.retireeLe || signaleesParMoi.has(String(l.id))) return false;
    const niveau = calculerNiveauProfil({ prive: l.auteurPrive }, { estMoi: false, pote: lien.pote, abonne: lien.jeSuis === "suivi" });
    return peutVoirListe({ visibilite: l.visibilite === "bande" ? "bande" : "tous" }, niveau, coAuteur.has(l.id));
  };
  const lieuxDe = (listeId: number, seulementMiens: boolean) => (lieuxDeListe.get(listeId) ?? [])
    .filter((l) => !seulementMiens || l.ajouteParId === compteId).map((l) => l.lieuId).sort((a, b) => a - b);

  return {
    genereLe: iso(o.maintenant),
    profil: d.profil && moi ? {
      personne: moi,
      reglages: { trouvable: d.profil.trouvable, suggerable: d.profil.suggerable, activitePartagee: d.profil.activitePartagee, pushSocial: d.profil.pushSocial },
      creeLe: iso(d.profil.creeLe),
    } : null,
    bande: [...d.bande].sort(parDate).flatMap((b) => nommer(b.poteId, (p) => ({ personne: p, depuis: iso(b.creeLe) }))),
    demandesBande: {
      envoyees: [...d.demandesEnvoyees].sort(parDate).flatMap((x) => nommer(x.aId, (p) => ({ personne: p, date: iso(x.creeLe) }))),
      recues: [...d.demandesRecues].sort(parDate).flatMap((x) => nommer(x.deId, (p) => ({ personne: p, date: iso(x.creeLe) }))),
    },
    // Ceux que TU as bloqués, du plus ancien au plus récent (listerBlocages les rend du plus récent au plus ancien)
    bloques: [...parMoi].reverse().flatMap((id) => personnes.get(id) ?? []),
    suivis: {
      abonnements: [...d.abonnements].sort(parDate).flatMap((s) => nommer(s.suiviId, (p) => {
        const statut = s.statut === "accepte" ? ("suivi" as const) : ("demande" as const);
        return { personne: p, depuis: iso(statut === "suivi" ? (s.accepteLe ?? s.creeLe) : s.creeLe), statut };
      })),
      abonnes: [...d.abonnes].sort(parDate).flatMap((s) => nommer(s.suiveurId, (p) => ({ personne: p, depuis: iso(s.accepteLe ?? s.creeLe) }))),
      demandesRecues: [...d.demandesSuiviRecues].sort(parDate).flatMap((s) => nommer(s.suiveurId, (p) => ({ personne: p, depuis: iso(s.creeLe) }))),
    },
    conversations: conversations.flatMap((c) => {
      const messages = messagesDe.get(c.id) ?? [];
      const membre = mesConversations.has(c.id);
      if (!membre && messages.length === 0) return [];
      return [{
        id: String(c.id),
        type: c.type as TypeConversation,
        // Une conversation quittée où restent tes messages : ni son titre, ni ses membres (tu n'en fais plus partie). Un
        // membre avec qui il y a un blocage n'est pas nommé : un privé avec lui n'a plus que toi
        titre: membre ? (titres.get(c.id) ?? null) : null,
        membres: membre ? (membresDe.get(c.id) ?? []).flatMap((m) => nommer(m.compteId, (p) => p.pseudo)) : [],
        messages: messages.map((m) => ({
          date: iso(m.creeLe),
          type: m.type as "texte" | "lieu" | "photo" | "vocal",
          ...(contenus.get(m.id) ?? { texte: null, lieuId: null }),
          taille: m.type === "photo" || m.type === "vocal" ? m.taille : null,
        })),
      }];
    }),
    // Le titre d'une invitation en attente seulement : après un refus, ou si celui qui t'invite a un blocage avec toi, null
    invitationsGroupes: [...d.invitationsGroupes].sort(parDate).map((i) => ({
      titre: invitationLisible(i) ? (titres.get(i.conversationId) ?? null) : null,
      date: iso(i.creeLe),
      statut: i.statut === "refuse" ? ("refuse" as const) : ("invite" as const),
    })),
    reactions: [...d.reactions].sort(parDate).map((r) => ({ messageId: String(r.messageId), reaction: r.reaction as CodeReaction, date: iso(r.creeLe) })),
    sorties: [...d.sorties].sort((a, b) => a.quand.getTime() - b.quand.getTime() || a.id - b.id).flatMap((s) => {
      const mienne = invitationSortie.get(s.id);
      // Sans ton invitation, tu as quitté la sortie (même celle que tu as créée : la colonne garde ton id) ; choix de
      // construction : une invitation que tu as refusée n'y est pas (le contrat n'a pas de rôle « refusé »)
      if (!mienne || (mienne.statut !== "accepte" && mienne.statut !== "invite")) return [];
      const organisateurEffectif = trouverOrganisateurEffectif(s.organisateurId, participantsDe.get(s.id) ?? []);
      if (mienne.statut === "invite" && estInvitationCachee({ organisateurEffectif }, mienne, caches)) return [];
      // Comme moi.organisateur de l'app (presenterSortie) : celui qui a la main, pas seulement celui qui l'a créée
      const role = mienne.statut === "invite" ? "invite" : organisateurEffectif === compteId ? "organisateur" : "participant";
      return [{ titre: s.titre, quand: iso(s.quand), role, propositions: lieuxDeSortie(propositionsDe, s.id), votes: lieuxDeSortie(votesDe, s.id) }];
    }),
    listes: [...d.listes].sort((a, b) => a.id - b.id).flatMap((l) => [
      ...(l.auteurId === compteId ? [{ titre: l.titre, role: "auteur" as const, lieux: lieuxDe(l.id, false) }] : []),
      // Co-auteur : les lieux que TU as ajoutés ; abonné : aucun lieu (ils sont à son auteur, qui peut la fermer). Le titre,
      // seulement si la liste t'est encore visible
      ...(coAuteur.has(l.id) ? [{ titre: visible(l) ? l.titre : null, role: "co-auteur" as const, lieux: lieuxDe(l.id, true) }] : []),
      ...(abonneListes.has(l.id) ? [{ titre: visible(l) ? l.titre : null, role: "abonne" as const, lieux: [] }] : []),
    ]),
    commentaires: [...d.commentaires].sort((a, b) => a.id - b.id).map((c) => ({ publicationId: String(c.publicationId), texte: c.texte, date: iso(c.creeLe) })),
    jaimesCommentaires: [...d.jaimesCommentaires].sort((a, b) => a - b).map(String),
    cloche: [...d.cloche].sort((a, b) => a.id - b.id).map((n) => ({ type: n.type as TypeCloche, date: iso(n.creeLe) })),
    signalements: [...d.signalements].sort((a, b) => a.id - b.id).flatMap((s) => estCibleSociale(s.cible)
      ? [{ cible: s.cible, raison: s.raison, precision: s.precision, explication: s.explication, date: iso(s.creeLe), statut: s.statut }]
      : []),
    masques: [...d.masques].sort(parDate).map((m) => ({ cible: m.cible as CibleMasque, cibleId: m.cibleId })),
    ...(d.limitations ? { limitations: [...d.limitations].sort((a, b) => parDate(a, b) || a.id - b.id).map((l) => ({
      motif: l.motif, motivation: l.motivation, debut: iso(l.debut), fin: isoOuNull(l.fin), leveeLe: isoOuNull(l.leveeLe),
      contestation: l.contestation, contesteLe: isoOuNull(l.contesteLe), reexamineLe: isoOuNull(l.reexamineLe), decideeLe: iso(l.creeLe),
    })) } : {}),
  };
}

/** Le service, posé sur une façon de lire les lignes (la base, ou les tables en mémoire) et, s'il y en a, les limitations */
export function creerServicesExportSocial(o: {
  lire: (compteId: number) => Promise<DonneesExportSocial>;
  relations: RelationsExportSocial;
  chiffrement: ChiffrementSocial | null;
  /** Absente : l'export n'a pas de champ « limitations » */
  listerLimitations?: ListerLimitationsExport;
}): ServicesExportSocial {
  return {
    async exporter(compteId, maintenant) {
      // La route passe par exigerChiffrementSocial : sans clé, c'est une erreur de branchement (500), jamais un export vide
      if (!o.chiffrement) throw new Error("Chiffrement social absent : export sans exigerChiffrementSocial");
      const [donnees, limitations] = await Promise.all([o.lire(compteId), o.listerLimitations?.(compteId)]);
      return assemblerExportSocial(limitations ? { ...donnees, limitations } : donnees, {
        compteId, relations: o.relations, chiffrement: o.chiffrement, maintenant,
      });
    },
  };
}
