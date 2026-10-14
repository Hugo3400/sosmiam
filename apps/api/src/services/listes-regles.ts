// Les listes de lieux (spécification sociale B.5, D.2 ; décidé le 14 octobre 2026) : contrat commun du service Prisma
// (listes.ts) et de son double en mémoire (listes-en-memoire.ts).
// - L'auteur remplit sa liste et choisit qui la voit (peutVoirListe de commun) : « tous » (à partir du niveau « public » :
//   tout le monde pour un compte public, abonnés et bande pour un compte privé) ou « bande » ; un co-auteur accepté la voit
//   toujours.
// - Jamais visible : une liste suspendue ou retirée par la modération (sauf pour son auteur, avec enModeration), une liste
//   que tu as signalée, une liste de quelqu'un avec qui il y a un blocage (dans un sens ou dans l'autre).
// - 404 avant 403 : une liste que tu ne vois pas est « inconnue », même pour les gestes réservés à l'auteur.
// - Co-auteurs : des potes de la bande de l'auteur, 10 au plus (invitations en attente comprises) ; un refus est silencieux
//   et reste noté 30 jours (on ne réinvite pas en boucle) ; quitter la bande de l'auteur retire le co-auteur (lot L3).
// - Une liste garde ses lieux par leur identifiant ; seuls les lieux encore publiés sont montrés et comptés.
// Aucune règle d'âge : l'app est réservée aux majeurs.
import type { ListeApi, ListeResumeApi, NouvelleListe } from "../../../../packages/commun/src/types/listes.ts";
import type { EffetSocial } from "./effets-sociaux-regles.ts";

export type RefusListe =
  | "liste-inconnue" | "reserve-a-l-auteur" | "trop-de-listes" | "liste-pleine" | "trop-de-co-auteurs" | "pas-dans-la-bande"
  | "lieu-inconnu" | "invitation-inconnue" | "personne-inconnue"
  /** S'abonner à sa propre liste, s'inviter soi-même : 400 champ-invalide */
  | "champ-invalide"
  /** La clé Idempotency-Key a déjà servi à créer autre chose (un groupe, une sortie) : 400 champ-invalide { champ: "idClient" } */
  | "cle-deja-prise";

export type ResultatListe = { ok: true; liste: ListeApi } | { ok: false; erreur: RefusListe };

export type MesListes = { miennes: ListeResumeApi[]; coEcrites: ListeResumeApi[]; suivies: ListeResumeApi[]; invitations: ListeResumeApi[] };

export interface ServicesListes {
  /** Tes listes (même en modération), celles que tu remplis avec leur auteur, celles que tu suis (encore visibles) et les
   *  invitations à remplir qui attendent ta réponse ; les plus récemment modifiées d'abord */
  listerMiennes(compteId: number): Promise<MesListes>;
  /** Listes visibles de ta bande et des personnes que tu suis (suivi accepté), sans les tiennes ni celles que tu remplis,
   *  sans celles retirées de ta vue ; LISTES_PAR_PAGE par page, les plus récemment modifiées d'abord */
  listerADecouvrir(compteId: number, apres: string | null): Promise<{ listes: ListeResumeApi[]; suite: string | null }>;
  /** null : absente, ou pas visible pour toi */
  lire(compteId: number, listeId: number): Promise<ListeApi | null>;
  /** cle : Idempotency-Key ; une clé déjà vue rend la liste déjà créée (cree: faux) ; 50 listes au plus */
  creer(compteId: number, l: NouvelleListe, cle: string, maintenant: Date): Promise<{ ok: true; liste: ListeApi; cree: boolean } | { ok: false; erreur: RefusListe }>;
  modifier(compteId: number, listeId: number, m: Partial<NouvelleListe>, maintenant: Date): Promise<ResultatListe>;
  supprimer(compteId: number, listeId: number): Promise<{ ok: true } | { ok: false; erreur: RefusListe }>;
  /** Auteur ou co-auteur accepté ; 100 lieux au plus ; un co-auteur ne retire que les lieux qu'il a ajoutés */
  basculerLieu(compteId: number, listeId: number, lieuId: number, oui: boolean, maintenant: Date): Promise<ResultatListe>;
  /** Un pote de la bande de l'auteur ; déjà là, ou refus de moins de 30 jours : la réponse est la même, rien ne part.
   *  Effets : « liste-coauteur » (cloche) */
  inviterCoAuteur(compteId: number, listeId: number, invite: number, maintenant: Date): Promise<
    { ok: true; liste: ListeApi; effets: EffetSocial[] } | { ok: false; erreur: RefusListe }>;
  accepterCoAuteur(compteId: number, listeId: number, maintenant: Date): Promise<ResultatListe>;
  /** membre "moi" : refuser (« refuse », gardé 30 jours, sans prévenir) ou ne plus remplir la liste ; sinon l'auteur retire */
  retirerCoAuteur(compteId: number, listeId: number, membre: number | "moi", maintenant: Date): Promise<{ ok: true } | { ok: false; erreur: RefusListe }>;
  /** Suivre une liste visible (pas la sienne) */
  basculerAbonnement(compteId: number, listeId: number, oui: boolean, maintenant: Date): Promise<ResultatListe>;
}

/** Listes par page de « À découvrir » */
export const LISTES_PAR_PAGE = 20;
/** Un refus de co-auteur reste noté 30 jours : l'auteur ne réinvite pas la personne en boucle */
export const DUREE_REFUS_CO_AUTEUR_JOURS = 30;
/** Listes lues au plus pour chaque rubrique de GET /app/listes (choix de construction) */
export const MAX_LISTES_PAR_RUBRIQUE = 200;
