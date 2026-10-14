// Les sorties entre potes (spécification sociale B.6, D.2, E.3 ; décidé le 8 et le 14 octobre 2026) : contrat commun du
// service Prisma (sorties.ts, lectures dans sorties-lecture.ts) et de son double en mémoire (sorties-en-memoire.ts).
// - Chaque invité accepte (« Tu viens ? ») avant d'entrer dans le vote et la discussion : un invité qui n'a pas répondu ne
//   voit que l'invitation. Participants : les invitations « accepte », organisateur compris.
// - 404 avant 403 : une sortie dont tu n'es ni participant ni invité est « inconnue », même pour les gestes de l'organisateur.
// - Un refus ne prévient personne et reste noté jusqu'à la date : inviter saute la personne, sans le dire.
// - 15 personnes au plus, organisateur et invitations en attente compris (les refus ne comptent pas).
// - La discussion est une conversation « sortie » : ses membres ne changent QUE par ici (réponse, invitation, retrait,
//   départ, annulation) ; un participant la lit depuis le début (visibleApres 0).
// - Blocages dans les deux sens : les votes et propositions d'une personne avec qui il y a un blocage ne sont pas nommés,
//   mais comptent (nombreVotes, lieu retenu). Les participants restent nommés. Une invitation n'existe qu'entre potes sans
//   blocage : un blocage avec l'organisateur qui a la main (ou avec celui qui a invité) la cache, et elle ne s'accepte plus.
// - Seuls les votes des participants comptent (celui qui part, ou qui est retiré, emporte les siens).
// - Organisateur parti (compte supprimé) : le plus ancien participant prend la main (choisirOrganisateurSortie).
// - Notifications (cloche et téléphone, hors anti-spam : réponse de Hugo du 14/10/2026) : « invitation-sortie » aux
//   invités, « sortie-lieu-choisi » aux participants, « sortie-annulee » (cloche seulement) aux participants et invités.
// Aucune règle d'âge : l'app est réservée aux majeurs.
import type { InvitationSortieApi, SortieApi } from "../../../../packages/commun/src/types/sorties.ts";
import type { EffetSocial } from "./effets-sociaux-regles.ts";

export type LectureSortie = { sortie: SortieApi } | { invitation: InvitationSortieApi } | { inchange: true; version: number };

export type RefusSortie =
  | "sortie-inconnue" | "sortie-passee" | "sortie-pleine" | "reserve-a-l-organisateur" | "vote-termine" | "max-propositions"
  | "lieu-inconnu" | "pas-dans-la-bande" | "trop-de-sorties" | "personne-inconnue"
  /** La clé Idempotency-Key a déjà servi à créer autre chose (un groupe, une liste) : 400 champ-invalide { champ: "idClient" } */
  | "cle-deja-prise";

/** Une sortie à créer, déjà validée (validerNouvelleSortie de commun) et ses invités résolus en comptes */
export type NouvelleSortie = { titre: string; emoji: string; quand: Date; finVote: Date; invites: number[]; lieux: number[] };

export type ResultatSortie = { ok: true; sortie: SortieApi } | { ok: false; erreur: RefusSortie };

export interface ServicesSorties {
  /** Tes sorties (à venir d'abord, la plus proche en tête, puis les passées, la plus récente en tête ; sans celles retirées
   *  de ta vue ; MAX_SORTIES_LISTEES au plus) et tes invitations à venir qui attendent ta réponse (sans celles d'une
   *  personne avec qui il y a un blocage : estInvitationCachee) */
  lister(compteId: number, maintenant: Date): Promise<{ sorties: SortieApi[]; invitations: InvitationSortieApi[] }>;
  /** null : ni participant ni invité (ou tu as refusé, ou ton invitation est cachée) ; version égale à la sienne : { inchange } */
  lire(compteId: number, sortieId: number, version: number | null, maintenant: Date): Promise<LectureSortie | null>;
  /**
   * Crée la conversation « sortie » (l'organisateur en est membre), la sortie, l'invitation « accepte » de l'organisateur,
   * celles des invités (potes de sa bande, sans blocage, relus sous le verrou de son compte), les propositions et ses votes.
   * Effets : « invitation-sortie ». cle : Idempotency-Key ; une clé déjà vue rend la sortie déjà créée (cree: faux, aucun effet)
   */
  creer(compteId: number, s: NouvelleSortie, cle: string, maintenant: Date): Promise<
    { ok: true; sortie: SortieApi; cree: boolean; effets: EffetSocial[] } | { ok: false; erreur: RefusSortie }>;
  /**
   * Oui : « accepte » + membre de la discussion (il la lit depuis le début) ; non : « refuse », sans prévenir (sortie: null).
   * Un blocage avec l'organisateur qui a la main (ou avec celui qui a invité), relu sous le verrou : l'invitation est
   * effacée et la sortie est « inconnue »
   */
  repondre(compteId: number, sortieId: number, vient: boolean, maintenant: Date): Promise<{ ok: true; sortie: SortieApi | null } | { ok: false; erreur: RefusSortie }>;
  /** L'organisateur invite d'autres potes ; saute, sans le dire, ceux qui ont refusé et ceux déjà là. Effets : « invitation-sortie » */
  inviter(compteId: number, sortieId: number, invites: number[], maintenant: Date): Promise<
    { ok: true; sortie: SortieApi; effets: EffetSocial[] } | { ok: false; erreur: RefusSortie }>;
  /** L'organisateur retire un participant ou une invitation en attente, sans prévenir : invitation effacée (il pourra le
   *  réinviter), et il sort de la discussion. Se retirer soi-même revient à quitter. personne null (identifiant inconnu) :
   *  personne-inconnue, mais seulement après sortie-inconnue et reserve-a-l-organisateur (rien n'est dit d'une personne avant) */
  retirerParticipant(compteId: number, sortieId: number, personne: number | null, maintenant: Date): Promise<{ ok: true } | { ok: false; erreur: RefusSortie }>;
  /** Celui qui propose vote d'office ; deja : ce lieu était déjà proposé (rien ne change) */
  proposer(compteId: number, sortieId: number, lieuId: number, maintenant: Date): Promise<
    { ok: true; sortie: SortieApi; deja: boolean } | { ok: false; erreur: RefusSortie }>;
  /** On peut voter pour plusieurs lieux ; retirer un vote absent ne change rien */
  voter(compteId: number, sortieId: number, lieuId: number, oui: boolean, maintenant: Date): Promise<ResultatSortie>;
  /** L'organisateur clôt le vote : lieu retenu tout de suite. Effets : « sortie-lieu-choisi » aux autres participants */
  terminerVote(compteId: number, sortieId: number, maintenant: Date): Promise<
    { ok: true; sortie: SortieApi; effets: EffetSocial[] } | { ok: false; erreur: RefusSortie }>;
  /**
   * Quitter (et la discussion avec) ; une invitation en attente devient un refus. L'organisateur qui part passe la main au
   * plus ancien participant ; sans participant, la sortie et sa discussion sont effacées (effacerConversations). Rien à
   * quitter : rien ne se passe (la route répond 200, sans rien dire de la sortie)
   */
  quitter(compteId: number, sortieId: number, maintenant: Date): Promise<void>;
  /** L'organisateur annule : sortie et discussion effacées (un message signalé garde son instantané et son fichier).
   *  Effets : « sortie-annulee » (cloche) aux participants et aux invités */
  annuler(compteId: number, sortieId: number): Promise<{ ok: true; effets: EffetSocial[] } | { ok: false; erreur: RefusSortie }>;
  /**
   * Tâche de la minute (taches/terminer-votes-sorties.ts) : chaque sortie dont finVote est passé et voteTermineLe vide reçoit,
   * sous le verrou de sa ligne, son lieu retenu (choisirLieuGagnant), SORTIES_PAR_PASSAGE au plus par passage. Effets :
   * « sortie-lieu-choisi » à tous les participants (acteur null : personne n'a cliqué). terminees : leur nombre ; echecs :
   * celles qui n'ont pas pu être terminées (réessayées au passage suivant, sans bloquer les autres)
   */
  terminerVotesEchus(maintenant: Date): Promise<{ terminees: number; echecs: number; effets: EffetSocial[] }>;
}

/** Sorties rendues au plus par GET /app/sorties (à venir d'abord) : choix de construction, à confirmer par Hugo */
export const MAX_SORTIES_LISTEES = 100;
/** Sorties terminées au plus par passage de la tâche de la minute (les suivantes attendent le passage d'après) */
export const SORTIES_PAR_PASSAGE = 100;

/**
 * Une invitation que l'invité ne voit plus : un blocage, dans un sens ou dans l'autre (`caches`), avec l'organisateur qui a
 * la main ou avec celui qui l'a invité. Le blocage efface d'habitude l'invitation (bande.ts) ; celle-ci reste quand
 * l'organisateur est parti avec son compte et que celui qui a pris la main bloque (ou est bloqué).
 */
export function estInvitationCachee(d: { organisateurEffectif: number | null }, mienne: { inviteParId: number | null }, caches: ReadonlySet<number>): boolean {
  return [d.organisateurEffectif, mienne.inviteParId].some((id) => id !== null && caches.has(id));
}

/**
 * Une réinvitation à la même sortie (« retirer, puis réinviter ») ne fait plus sonner le téléphone pendant 24 h : la cloche
 * suffit. Choix de construction contre une boucle qui ferait sonner un pote sans fin, à confirmer par Hugo
 */
export const DUREE_SANS_NOUVEAU_SON_MS = 24 * 60 * 60 * 1000;
/** Au-delà, les sons notés les plus anciens sont oubliés : la mémoire ne grossit pas sans fin */
const MAX_SONS_NOTES = 50_000;

/**
 * Les invitations à une sortie qui ont déjà fait sonner un téléphone, dans ce processus : des numéros, jamais écrits
 * ailleurs. Un redémarrage les oublie (au pire, un son de plus).
 */
export function creerMemoireSonsInvitations() {
  const notes = new Map<string, number>();
  return {
    /** Ceux de `candidats` dont le téléphone peut sonner pour cette sortie (pas de son dans les 24 h) ; ils sont notés */
    retenir(sortieId: number, candidats: Iterable<number>, maintenant: Date): Set<number> {
      const t = maintenant.getTime();
      // Notés dans l'ordre du temps : les plus anciens d'abord
      for (const [cle, quand] of notes) {
        if (t - quand < DUREE_SANS_NOUVEAU_SON_MS) break;
        notes.delete(cle);
      }
      const retenus = new Set<number>();
      for (const compteId of candidats) {
        const cle = `${sortieId}:${compteId}`;
        const avant = notes.get(cle);
        if (avant !== undefined && t - avant < DUREE_SANS_NOUVEAU_SON_MS) continue;
        notes.delete(cle);
        notes.set(cle, t);
        retenus.add(compteId);
      }
      for (const cle of notes.keys()) {
        if (notes.size <= MAX_SONS_NOTES) break;
        notes.delete(cle);
      }
      return retenus;
    },
  };
}
