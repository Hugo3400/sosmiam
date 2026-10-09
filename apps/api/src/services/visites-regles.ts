// Visites, fidélité et comptoir (docs/decisions.md, « Scan et validation des visites ») : les lignes lues et écrites, et
// les gestes élémentaires demandés aux données. Les règles sont écrites une fois, au-dessus de ces gestes
// (visites-client.ts, fidelite-client.ts, comptoir.ts) ; la base (visites.ts) et le double des tests
// (visites-en-memoire.ts) ne font que lire et écrire. Sans accès à la base ici.
import type { ProgrammeFidelite } from "../../../../packages/commun/src/types/fidelite.ts";
import type { TypeLieu } from "../../../../packages/commun/src/types/lieu.ts";
import type { LieuResume } from "../../../../packages/commun/src/types/lieu-resume.ts";
import type { ResultatPosition } from "../../../../packages/commun/src/types/position.ts";
import type { ModeValidation, MotifRefusVisite, ReglementVisite, StatutVisite } from "../../../../packages/commun/src/types/visite.ts";
import type { RoleRattachement } from "./pro-regles.ts";

/** Le petit mot d'une contestation (lu par l'équipe SOS Miam, jamais par le lieu) */
export const MOT_CONTESTATION_MAX = 500;
/** Validations récentes montrées au comptoir (les autres sont dans l'historique du lieu) */
export const VALIDEES_AU_COMPTOIR = 10;
/** Visites rendues à la personne (« Mes visites ») */
export const VISITES_RENDUES = 200;

export type LigneVisite = {
  id: number;
  compteId: number;
  lieuId: number;
  mode: ModeValidation;
  statut: StatutVisite;
  code: string | null;
  creeLe: Date;
  expireLe: Date | null;
  valideLe: Date | null;
  decideLe: Date | null;
  decideParId: number | null;
  pendantSos: boolean;
  points: number;
  tampon: boolean;
  resultatPosition: ResultatPosition | null;
  motifRefus: MotifRefusVisite | null;
  contestee: boolean;
  contestation: string | null;
  avisOuvertLe: Date | null;
  avisFermeLe: Date | null;
  avisDonne: boolean;
  presentationId: number | null;
  reservationId: number | null;
  annulableJusqua: Date | null;
  reglement: ReglementVisite | null;
};
export type NouvelleVisite = Omit<LigneVisite, "id">;
export type ChampsVisite = Partial<Omit<LigneVisite, "id" | "compteId" | "lieuId">>;

export type LignePresentation = {
  id: number;
  lieuId: number;
  montreParId: number | null;
  personnes: number;
  restantes: number;
  reglement: ReglementVisite | null;
  creeLe: Date;
  expireLe: Date;
  cacheeLe: Date | null;
};

export type LigneProgramme = Omit<ProgrammeFidelite, "modifieLe"> & { modifieLe: Date };

/** Récompense gagnée, pas encore offerte */
export type LigneRecompense = { id: number; libelle: string; alcool: boolean; gagneeLe: Date };
/** Demande de récompense encore valable */
export type LigneDemande = { id: number; recompenseId: number; code: string; creeLe: Date; expireLe: Date };
export type LigneCarte = { id: number; compteId: number; lieuId: number; tampons: number; pretes: LigneRecompense[]; demande: LigneDemande | null };

/** Un lieu publié, avec ce qu'il faut pour valider une visite chez lui */
export type LieuVisite = LieuResume & {
  position: { latitude: number; longitude: number } | null;
  reservable: boolean;
  validationActive: boolean;
  /** Rayon réglé par l'équipe SOS Miam (null : 200 m) */
  rayonM: number | null;
  codePublic: string | null;
  /** Un SOS du soir est en cours (lieu vérifié seulement) */
  sosEnCours: boolean;
};

/** Ce qu'il faut d'un compte pour valider une visite, ou pour l'afficher au comptoir (prénom, initiale, emoji) */
export type CompteVisiteur = {
  id: number;
  prenom: string;
  avatar: string | null;
  nomChiffre: string | null;
  dateNaissanceChiffree: string | null;
  emailVerifie: boolean;
  /** Ses rattachements validés (gérant ou équipe) */
  rattachements: { lieuId: number; role: RoleRattachement }[];
};

export type FiltreVisites = { compteId?: number; lieuId?: number; statuts?: StatutVisite[]; presentationId?: number; limite?: number };

/**
 * Les gestes élémentaires, dans une transaction (ecrire) ou non (lire) ; jamais de règle métier ici. Règle des appelants :
 * tout geste d'écriture sur une visite ou une carte verrouille d'abord le compte du client, puis relit la ligne.
 */
export interface TablesVisites {
  /** Verrou sur la ligne du compte (rien en lecture) : deux gestes du même compte se suivent */
  verrouillerCompte(compteId: number): Promise<void>;
  /** Verrou sur le lieu : codes à 4 chiffres et QR montrés se suivent */
  verrouillerLieu(lieuId: number): Promise<void>;

  lireLieu(lieuId: number, maintenant: Date): Promise<LieuVisite | null>;
  trouverLieuParCode(codePublic: string, maintenant: Date): Promise<LieuVisite | null>;
  /** Résumés des lieux (même plus publiés : l'historique les montre encore) */
  resumerLieux(ids: number[]): Promise<Map<number, LieuResume>>;
  listerLieuxQuiValident(): Promise<{ id: number; type: TypeLieu }[]>;
  lireComptes(ids: number[]): Promise<Map<number, CompteVisiteur>>;

  lireVisite(id: number): Promise<LigneVisite | null>;
  /** Du plus récent au plus ancien */
  listerVisites(filtre: FiltreVisites): Promise<LigneVisite[]>;
  creerVisite(visite: NouvelleVisite): Promise<LigneVisite>;
  modifierVisite(id: number, champs: ChampsVisite): Promise<void>;
  /** Les additions sans réponse dont l'heure est passée deviennent « expiree » (sans effet : ni points ni tampon) */
  expirerDemandes(maintenant: Date): Promise<void>;
  /** Codes à 4 chiffres en attente chez un lieu (additions et demandes de récompense) */
  listerCodesPris(lieuId: number, maintenant: Date): Promise<Set<string>>;

  lirePresentation(id: number): Promise<LignePresentation | null>;
  /** Le QR affiché en ce moment chez ce lieu (pas caché, pas fini, encore des places), le plus récent */
  lirePresentationAffichee(lieuId: number, maintenant: Date): Promise<LignePresentation | null>;
  creerPresentation(presentation: Omit<LignePresentation, "id">): Promise<LignePresentation>;
  cacherPresentations(lieuId: number, maintenant: Date): Promise<void>;
  /** Un scan de plus : vrai s'il restait une place */
  consommerPresentation(id: number): Promise<boolean>;

  lireProgramme(lieuId: number): Promise<LigneProgramme | null>;
  ecrireProgramme(programme: LigneProgramme): Promise<void>;
  lireCarte(compteId: number, lieuId: number, maintenant: Date): Promise<LigneCarte | null>;
  /** Cartes d'un compte (ou d'un lieu, avec une demande en cours) */
  listerCartes(filtre: { compteId: number } | { lieuId: number; avecDemande: true }, maintenant: Date): Promise<LigneCarte[]>;
  /** La carte, créée vide si besoin */
  creerCarte(compteId: number, lieuId: number, maintenant: Date): Promise<LigneCarte>;
  modifierTampons(carteId: number, tampons: number): Promise<void>;
  ajouterRecompense(carteId: number, recompense: Omit<LigneRecompense, "id">): Promise<number>;
  creerDemande(carteId: number, demande: Omit<LigneDemande, "id">): Promise<LigneDemande>;
  supprimerDemandes(carteId: number): Promise<void>;
  /** Une demande (même passée), avec sa carte */
  lireDemande(id: number): Promise<(LigneDemande & { carteId: number; compteId: number; lieuId: number }) | null>;
  /** Vrai si elle n'avait pas déjà été offerte */
  offrirRecompense(recompenseId: number, parId: number, le: Date): Promise<boolean>;
}

/** lire : sans transaction ; ecrire : tout ou rien, verrous compris */
export type DepotVisites = {
  lire<T>(fn: (t: TablesVisites) => Promise<T>): Promise<T>;
  ecrire<T>(fn: (t: TablesVisites) => Promise<T>): Promise<T>;
};
