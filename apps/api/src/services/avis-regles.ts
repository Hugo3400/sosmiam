// Avis des lieux (docs/decisions.md, « Scan et validation des visites » et « Lieux vérifiés et non vérifiés ») : les
// réglages, les lignes lues et écrites, et les gestes élémentaires demandés aux données. Les règles sont écrites une fois,
// au-dessus de ces gestes (avis-client.ts, avis-relecture.ts, avis-pro.ts) ; la base (avis.ts) et le double des tests
// (avis-en-memoire.ts) ne font que lire et écrire. Sans accès à la base ici.
import type { LieuResume } from "../../../../packages/commun/src/types/lieu-resume.ts";
import type { RaisonRelecture, StatutAvis, StatutReponseAvis, VerdictRelecture } from "../../../../packages/commun/src/types/avis.ts";
import type { ModeValidation, ReglementVisite } from "../../../../packages/commun/src/types/visite.ts";
import type { LigneVisite } from "./visites-regles.ts";

/** Un avis vérifié avec photo : +10 points (raison « avis-photo »), jamais pour un repas offert ni un avis non vérifié */
export const POINTS_AVIS_PHOTO = 10;
/** Avis rendus par page (lecture publique et comptoir) */
export const AVIS_PAR_PAGE = 30;
/** Avis non vérifié : un par compte et par lieu sur cette durée */
export const DELAI_AVIS_NON_VERIFIE_MS = 30 * 24 * 3600_000;

/**
 * Relecture (jamais un masquage : l'avis reste visible, l'équipe tranche dans le logiciel) :
 * - compte-neuf : le compte a moins de 7 jours ;
 * - rafale-notes : avec celui-ci, 3 avis ou plus aux notes tranchées (1 ou 5) sur ce lieu en 24 h ;
 * - tirage : 1 avis sur 20, au hasard.
 */
export const COMPTE_NEUF_MS = 7 * 24 * 3600_000;
export const RAFALE_FENETRE_MS = 24 * 3600_000;
export const RAFALE_SEUIL = 3;
export const NOTES_TRANCHEES: readonly number[] = [1, 5];
export const TIRAGE_RELECTURE_SUR = 20;
/** Un avis à relire quitte la liste des ambassadeurs après 3 verdicts « ok » ou « louche » (l'équipe a de quoi trancher) */
export const VERDICTS_PAR_AVIS = 3;
/** Avis montrés à la fois à un ambassadeur, le plus ancien d'abord */
export const AVIS_A_RELIRE_MAX = 20;

/**
 * Les avis visibles par tous (lecture publique, moyenne, comptoir). « en-relecture » en fait partie : on ne masque jamais
 * un avis automatiquement, la relecture se fait après la mise en ligne, comme pour la réponse du lieu.
 */
export const STATUTS_AVIS_VISIBLES: readonly StatutAvis[] = ["publie", "en-relecture"];

export type LigneAvis = {
  id: number;
  compteId: number;
  lieuId: number;
  /** null : avis non vérifié */
  visiteId: number | null;
  note: number;
  texte: string;
  photo: string | null;
  signature: string;
  mineur: boolean;
  statut: StatutAvis;
  raisonRelecture: RaisonRelecture | null;
  repasOffert: boolean;
  creeLe: Date;
  reponseTexte: string | null;
  reponseLe: Date | null;
  reponseParId: number | null;
  reponseStatut: StatutReponseAvis | null;
  /** Lus sur la visite (rien pour un avis non vérifié) : comment elle a été validée, et réglée avec une réduction */
  preuve: ModeValidation | null;
  avecReduction: boolean;
};

export type NouvelleLigneAvis = Omit<LigneAvis, "id" | "reponseTexte" | "reponseLe" | "reponseParId" | "reponseStatut" | "preuve" | "avecReduction">;

/** Ce qu'il faut d'une visite pour ouvrir son avis */
export type VisiteAvis = Pick<LigneVisite, "id" | "compteId" | "lieuId" | "statut" | "mode" | "avisOuvertLe" | "avisFermeLe" | "avisDonne"> & {
  reglement: ReglementVisite | null;
};

/** L'auteur d'un avis : signature (prénom, initiale chiffrée), âge, ancienneté, et les lieux auxquels il est lié */
export type CompteAuteur = {
  id: number;
  prenom: string;
  nomChiffre: string | null;
  dateNaissanceChiffree: string | null;
  emailVerifie: boolean;
  creeLe: Date;
  /** Rattachements validés ou en attente : il n'écrit pas d'avis chez eux, et un ambassadeur n'y relit rien */
  lieuxLies: number[];
};

/** Un lieu, publié ou non ; vérifié : il a au moins un rattachement validé (un compte SOS Miam) */
export type LieuAvis = LieuResume & { publie: boolean; verifie: boolean };

/**
 * Les gestes élémentaires, dans une transaction (ecrire) ou non (lire) ; jamais de règle métier ici. Règle des appelants :
 * l'écriture d'un avis verrouille d'abord le compte de l'auteur, puis relit la visite.
 */
export interface TablesAvis {
  /** Verrou sur la ligne du compte (rien en lecture) : deux avis du même compte se suivent */
  verrouillerCompte(compteId: number): Promise<void>;

  lireLieu(lieuId: number): Promise<LieuAvis | null>;
  /** Résumés des lieux (même plus publiés) */
  resumerLieux(ids: number[]): Promise<Map<number, LieuResume>>;
  lireCompte(compteId: number): Promise<CompteAuteur | null>;

  lireVisite(id: number): Promise<VisiteAvis | null>;
  /** Les visites validées du compte dont l'avis est ouvert et pas donné, chez un lieu publié, les plus récentes d'abord */
  listerVisitesAvisOuvert(compteId: number, maintenant: Date): Promise<LigneVisite[]>;
  /** Vrai si l'avis de cette visite n'était pas déjà donné */
  marquerAvisDonne(visiteId: number): Promise<boolean>;

  creerAvis(avis: NouvelleLigneAvis): Promise<LigneAvis>;
  lireAvis(id: number): Promise<LigneAvis | null>;
  /** Les avis d'un lieu dans ces statuts, du plus récent au plus ancien ; apres : seulement ceux d'identifiant plus petit */
  listerAvisLieu(lieuId: number, statuts: readonly StatutAvis[], apres: number | null, limite: number): Promise<LigneAvis[]>;
  /** Combien d'avis de chaque note (dans ces statuts) */
  compterNotes(lieuId: number, statuts: readonly StatutAvis[]): Promise<{ note: number; nombre: number }[]>;
  /** Les visites validées du lieu, une ligne par client (identifiant opaque) et par jour de Paris (« AAAA-MM-JJ ») */
  listerJoursClients(lieuId: number): Promise<{ client: string; jour: string }[]>;
  /** Avis de ce lieu écrits depuis `depuis` (tous statuts), avec ces notes */
  compterAvisRecents(lieuId: number, depuis: Date, notes: readonly number[]): Promise<number>;
  /** Le dernier avis non vérifié du compte chez ce lieu (sa date), ou null */
  lireDernierAvisNonVerifie(compteId: number, lieuId: number): Promise<Date | null>;

  /**
   * Les avis en relecture qu'un ambassadeur peut relire, le plus ancien d'abord : jamais l'avis d'un mineur, jamais le sien,
   * jamais chez un lieu non publié ou de `lieuxExclus`, jamais un avis qu'il a déjà relu ni un avis qui a déjà `verdictsMax`
   * verdicts « ok » ou « louche »
   */
  listerARelire(ambassadeurId: number, lieuxExclus: number[], verdictsMax: number, limite: number): Promise<LigneAvis[]>;
  /** « deja » : cet ambassadeur a déjà rendu son verdict sur cet avis */
  ajouterRelecture(avisId: number, ambassadeurId: number, verdict: VerdictRelecture, le: Date): Promise<"ok" | "deja">;
  /** Pose la réponse publique du lieu, seulement s'il n'y en a pas déjà une ; vrai si elle est posée */
  poserReponse(avisId: number, reponse: { texte: string; le: Date; parId: number }): Promise<boolean>;
}

/** lire : sans transaction ; ecrire : tout ou rien, verrous compris */
export type DepotAvis = {
  lire<T>(fn: (t: TablesAvis) => Promise<T>): Promise<T>;
  ecrire<T>(fn: (t: TablesAvis) => Promise<T>): Promise<T>;
};
