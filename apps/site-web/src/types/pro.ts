// Types de l'espace pro (https://pro.sosmiam.fr) et de la fiche publique d'un lieu, tels que l'API les rend.
// Contrats complets : en tête de apps/api/src/routes/pro.ts, routes/comptes.ts (rattachements) et routes/lieux-publics.ts.
// Les codes des infos pratiques sont ceux de packages/commun/src/types/infos-pratiques.ts (recopiés : le site ne charge
// pas encore packages/commun).
import type { CategorieLieu } from "~/types/lieux";

/** Le rôle d'un compte dans un lieu : le gérant (il modifie la fiche) ou un membre de l'équipe (il la lit). */
export type RoleLieu = "gerant" | "equipe";

/** Le rattachement d'un compte à un lieu : « en-attente » tant que l'équipe (ou l'invité) n'a pas répondu. */
export type StatutRattachement = "en-attente" | "valide" | "refuse";

/** Un lieu tenu par le compte connecté (compte.pro.lieux, toujours présent). */
export type LieuDuCompte = { lieuId: number; nom: string; ville: string; role: RoleLieu; statut: StatutRattachement };

/** La partie « pro » du compte connecté. */
export type ComptePro = { lieux: LieuDuCompte[] };

/**
 * Une demande ou une invitation du compte (GET /comptes/moi/rattachements). Invitation dans une équipe : rôle « equipe »,
 * statut « en-attente ». `reponse` : le mot de l'équipe SOS Miam (après un refus, par exemple). Dates ISO 8601.
 */
export type Rattachement = {
  id: number;
  lieuId: number;
  nom: string;
  ville: string;
  emoji: string;
  role: RoleLieu;
  statut: StatutRattachement;
  reponse: string | null;
  creeLe: string;
  decideLe: string | null;
};

/** Un lieu trouvé par « Chercher mon lieu » (GET /pro/recherche-lieux) : publié, ou encore en brouillon. */
export type LieuTrouve = {
  id: number;
  nom: string;
  emoji: string;
  type: CategorieLieu;
  quartier: string;
  ville: string;
  statut: "publie" | "brouillon";
  estVerifie: boolean;
};

/** Les animaux : bienvenus partout, seulement en terrasse, ou pas d'animaux. */
export type AccueilAnimaux = "bienvenus" | "terrasse" | "non";

export type MoyenPaiement = "cb" | "sans-contact" | "especes" | "tickets-resto" | "cheques-vacances";

export type ReservationConseillee = "inutile" | "conseillee" | "obligatoire";

/** Les infos pratiques d'un lieu ; null (ou liste vide) : inconnu, jamais affiché au public (on ne devine pas). */
export type InfosPratiquesLieu = {
  telephone: string | null;
  siteWeb: string | null;
  /** Compte Instagram, sans « @ » */
  instagram: string | null;
  animaux: AccueilAnimaux | null;
  /** Accessible en fauteuil roulant (entrée et salle) */
  accessible: boolean | null;
  terrasse: boolean | null;
  wifi: boolean | null;
  /** Chaise haute ou menu enfant */
  enfants: boolean | null;
  /** Parking facile juste à côté */
  parking: boolean | null;
  paiements: MoyenPaiement[];
  reservation: ReservationConseillee | null;
};

/** Ce que la fiche d'un lieu a en commun, vue par son gérant ou par le public. */
type BaseFiche = InfosPratiquesLieu & {
  id: number;
  nom: string;
  adresse: string | null;
  type: CategorieLieu;
  emoji: string;
  /** « Trattoria », « Bar à cocktails »… */
  info: string;
  quartier: string;
  ville: string;
  /** Horaires lisibles : « Mar–sam, 12h–14h30 et 19h–23h » ("" ou null : inconnus) */
  horaires: string | null;
  /** La présentation du lieu ("" ou null : aucune) */
  texte: string | null;
  /** Vrai dès qu'un rattachement au lieu est validé */
  estVerifie: boolean;
};

/** La fiche d'un lieu vue par son gérant ou son équipe (GET /pro/lieux/:id). */
export type FichePro = BaseFiche & { statut: "publie" | "brouillon" | "masque" };

/** Ce que « Ma fiche » peut envoyer (PATCH /pro/lieux/:id) : null, "" ou [] efface l'info ; nom et adresse vont à l'équipe. */
export type ChampsFiche = Pick<FichePro, "nom" | "adresse" | "horaires" | "texte" | "telephone" | "siteWeb" | "instagram" | "animaux"
  | "accessible" | "terrasse" | "wifi" | "enfants" | "parking" | "paiements" | "reservation">;

/** Réponse de PATCH /pro/lieux/:id : champs changés tout de suite, ceux partis vers l'équipe, et la fiche à jour. */
export type ResultatModificationFiche = { appliques: string[]; envoyesAEquipe: ("nom" | "adresse")[]; suggestionId: number | null; fiche: FichePro };

/**
 * Une suggestion de modification de la fiche (GET /pro/lieux/:id/suggestions) : d'un client, ou du lieu lui-même (nom,
 * adresse). `avant` et `proposition` : les champs de `champs`, avant et proposés. Jamais l'auteur.
 */
export type SuggestionFiche = {
  id: number;
  source: "client" | "pro";
  champs: string[];
  avant: Record<string, unknown>;
  proposition: Record<string, unknown>;
  /** « Pourquoi ? » écrit par l'auteur */
  message: string | null;
  statut: "en-attente" | "acceptee" | "partielle" | "refusee";
  champsAcceptes: string[];
  /** Réponse de l'équipe (seulement pour une suggestion du lieu) */
  reponse: string | null;
  /** Dates ISO 8601 */
  creeLe: string;
  decideLe: string | null;
};

/** Un membre de l'équipe d'un lieu (GET /pro/lieux/:id/equipe, gérant seulement) ; email null pour un gérant. */
export type MembreEquipe = {
  compteId: number;
  prenom: string;
  email: string | null;
  role: RoleLieu;
  statut: "en-attente" | "valide";
  creeLe: string;
  decideLe: string | null;
};

/** La fiche publique d'un lieu publié (GET /lieux/publics/:id), sur https://sosmiam.fr/lieux/:id. */
export type FichePublique = BaseFiche & {
  prix: string;
  couleurs: string[];
  /** Prénom de l'ambassadeur qui l'a fait découvrir */
  decouvertPar: string | null;
};
