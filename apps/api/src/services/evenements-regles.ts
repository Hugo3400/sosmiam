// Événements des lieux (voir routes/evenements.ts et routes/comptoir.ts) : ce que les contrôleurs demandent aux données.
// Sans accès à la base : lu aussi par le double en mémoire (evenements-en-memoire.ts). Prisma : evenements.ts.
// Les règles (10 à venir, dates, visibilité, alcool) sont dans packages/commun et dans les contrôleurs ; ici, seulement
// lire et écrire, et le compte des événements à venir fait sous verrou du lieu.
import { DUREE_EVENEMENT_MAX_MS } from "../../../../packages/commun/src/regles/evenements.ts";
import type { TarifEvenement, TypeEvenement } from "../../../../packages/commun/src/types/evenement.ts";
import type { LieuResume } from "../../../../packages/commun/src/types/lieu-resume.ts";
import type { ZoneLieux } from "./lieux-app-regles.ts";

/** Au plus, par lecture d'Explorer ou d'une fiche, avant de calculer les dates (les plus anciennes d'abord) */
export const EVENEMENTS_LUS_MAX = 1000;
/** Au plus, par lecture de l'équipe (à venir, et finis ou annulés depuis 30 jours) */
export const EVENEMENTS_EQUIPE_LUS_MAX = 200;
/** Au plus, par lecture de « Ça m'intéresse » */
export const INTERETS_LUS_MAX = 300;

export type LigneEvenement = {
  id: number;
  lieuId: number;
  compteId: number | null;
  titre: string;
  type: TypeEvenement;
  description: string;
  debut: Date;
  fin: Date | null;
  hebdoJusqua: Date | null;
  tarif: TarifEvenement;
  prixCentimes: number | null;
  places: number | null;
  photo: string | null;
  alcool: boolean;
  creeLe: Date;
  modifieLe: Date;
  annuleLe: Date | null;
  suspendu: boolean;
};

/** Ce que l'équipe écrit (POST, PUT), déjà vérifié par validerEvenement */
export type ChampsEvenement = Pick<LigneEvenement, "titre" | "type" | "description" | "debut" | "fin" | "hebdoJusqua" | "tarif" | "prixCentimes" | "places" | "alcool">;

/** Un lieu, avec son statut de publication (« publie » : visible dans l'app) */
export type LieuEvenement = LieuResume & { publie: boolean };

export type EvenementAvecLieu = LigneEvenement & { lieu: LieuEvenement };

/** Pour l'équipe : le prénom de qui l'a publié et le nombre de « Ça m'intéresse » */
export type EvenementEquipe = LigneEvenement & { publiePar: string | null; interesses: number };

/** Lieu publié, ni suspendus ni annulés, une date possible dans [du, au) ; dans la zone, ou d'un seul lieu */
export type FiltreEvenementsVisibles = { zone: ZoneLieux | null; lieuId: number | null; du: Date; au: Date };

/**
 * La dernière date d'un événement commence au plus tard à hebdoJusqua (ou à son début) et dure 24 h au plus : il peut
 * encore toucher `depuis` seulement si cette date-là est après `depuis` − 24 h. Les contrôleurs affinent ensuite avec
 * listerOccurrencesEvenement (packages/commun).
 */
export const calculerBornePeutFinir = (depuis: Date) => new Date(depuis.getTime() - DUREE_EVENEMENT_MAX_MS);

export interface ServicesEvenements {
  /** Le lieu (publié ou non), ou null s'il n'existe pas */
  lireLieu(lieuId: number): Promise<LieuEvenement | null>;
  /** Les événements du lieu qui peuvent finir après `depuis` (annulés et suspendus compris), EVENEMENTS_EQUIPE_LUS_MAX au plus */
  listerPourEquipe(lieuId: number, depuis: Date): Promise<EvenementEquipe[]>;
  /** Un événement, de n'importe quel lieu (le contrôleur vérifie que c'est celui de l'adresse), ou null */
  lirePourEquipe(evenementId: number): Promise<EvenementEquipe | null>;
  /**
   * Crée l'événement sous verrou du lieu, si le lieu a moins de `maximum` événements à venir à `maintenant` (pas annulés,
   * une date pas encore finie, suspendus compris) ; sinon « trop-d-evenements »
   */
  creer(lieuId: number, compteId: number, champs: ChampsEvenement, maintenant: Date, maximum: number): Promise<{ ok: true; id: number } | { ok: false; erreur: "trop-d-evenements" }>;
  modifier(evenementId: number, champs: ChampsEvenement): Promise<void>;
  /** Annule l'événement s'il ne l'est pas déjà */
  annuler(evenementId: number, maintenant: Date): Promise<void>;
  /** Les événements visibles qui peuvent avoir une date dans la période, EVENEMENTS_LUS_MAX au plus (plus anciens débuts d'abord) */
  listerVisibles(filtre: FiltreEvenementsVisibles): Promise<EvenementAvecLieu[]>;
  /** Un événement et son lieu (même suspendu, annulé ou passé), ou null */
  lireAvecLieu(evenementId: number): Promise<EvenementAvecLieu | null>;
  /** Les « Ça m'intéresse » du compte dont l'événement peut finir après `depuis`, INTERETS_LUS_MAX au plus */
  listerInterets(compteId: number, depuis: Date): Promise<{ evenement: EvenementAvecLieu; rappel: boolean }[]>;
  /** Pose (ou met à jour) le « Ça m'intéresse » */
  poserInteret(compteId: number, evenementId: number, rappel: boolean): Promise<void>;
  /** Le retire (rien à retirer : rien ne change) */
  retirerInteret(compteId: number, evenementId: number): Promise<void>;
  /** La date de naissance chiffrée du compte (null : compte du site, 18 ans) ; undefined : compte inconnu */
  lireNaissanceChiffree(compteId: number): Promise<string | null | undefined>;
}
