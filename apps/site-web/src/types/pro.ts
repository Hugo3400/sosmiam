// Types de l'espace pro (https://pro.sosmiam.fr) et de la fiche publique d'un lieu, tels que l'API les rend.
// Contrat PRÉVU (docs/decisions.md, « Espace pro ») : à ajuster ici quand les routes /pro/… de l'API seront écrites.
// Les codes des infos pratiques sont ceux de packages/commun/src/types/infos-pratiques.ts (recopiés : le site ne charge
// pas encore packages/commun).
import type { CategorieLieu } from "~/types/lieux";

/** Le rôle d'un compte dans un lieu : le gérant (il modifie la fiche) ou un membre de l'équipe (il la lit). */
export type RoleLieu = "gerant" | "equipe";

/** Le rattachement d'un compte à un lieu : « en-attente » tant que l'équipe (ou l'invité) n'a pas répondu. */
export type StatutRattachement = "en-attente" | "valide" | "refuse";

/** Un lieu tenu par le compte connecté (compte.pro.lieux). */
export type LieuDuCompte = {
  lieuId: number;
  nom: string;
  ville: string;
  role: RoleLieu;
  statut: StatutRattachement;
  /**
   * Id du rattachement : sert à accepter une invitation (rôle « equipe » en attente : POST
   * /comptes/moi/rattachements/:id/accepter). Absent du contrat de départ : à confirmer avec l'API.
   */
  rattachementId?: number;
};

/** La partie « pro » du compte connecté ; absente tant que l'API ne la rend pas (aucun lieu). */
export type ComptePro = { lieux: LieuDuCompte[] };

/** Un lieu trouvé par « Chercher mon lieu » (GET /pro/recherche-lieux?texte=…). */
export type LieuTrouve = { id: number; nom: string; ville: string; categorie: CategorieLieu };

/** Les animaux : bienvenus partout, seulement en terrasse, ou pas d'animaux. */
export type AccueilAnimaux = "bienvenus" | "terrasse" | "non";

export type MoyenPaiement = "cb" | "sans-contact" | "especes" | "tickets-resto" | "cheques-vacances";

export type ReservationConseillee = "inutile" | "conseillee" | "obligatoire";

/**
 * Les infos pratiques d'un lieu ; null (ou liste vide) : inconnu, jamais affiché au public (on ne devine pas).
 */
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

/** La fiche d'un lieu vue par son gérant ou son équipe (GET /pro/lieux/:id). */
export type FichePro = InfosPratiquesLieu & {
  id: number;
  nom: string;
  adresse: string | null;
  ville: string;
  categorie: CategorieLieu;
  /** Horaires lisibles : « Mar–sam, 12h–14h30 et 19h–23h » */
  horaires: string | null;
  /** La présentation du lieu */
  texte: string | null;
  /** Vrai dès qu'un rattachement au lieu est validé */
  estVerifie: boolean;
};

/** Les champs qu'on peut modifier depuis « Ma fiche » (PATCH /pro/lieux/:id { champs }). */
export type ChampFiche = Exclude<keyof FichePro, "id" | "ville" | "categorie" | "estVerifie">;

/** Réponse de PATCH /pro/lieux/:id : les champs changés tout de suite, et ceux partis vers l'équipe (nom, adresse). */
export type ResultatModificationFiche = { appliques: string[]; envoyesEquipe: string[] };

/** Une suggestion de modification de la fiche : d'un client, ou du lieu lui-même (nom, adresse). */
export type SuggestionFiche = {
  id: number;
  source: "client" | "pro";
  champs: { champ: string; avant: unknown; apres: unknown }[];
  /** « Pourquoi ? » écrit par l'auteur */
  message: string | null;
  statut: "en-attente" | "acceptee" | "partielle" | "refusee";
  /** Dates ISO 8601 */
  creeLe: string;
  decideLe: string | null;
};

/** Un membre de l'équipe d'un lieu (GET /pro/lieux/:id/equipe) : jamais son e-mail. */
export type MembreEquipe = { compteId: number; prenom: string; statut: StatutRattachement };

/** La fiche publique d'un lieu publié (GET /lieux/publics/:id), sur https://sosmiam.fr/lieux/:id. */
export type FichePublique = InfosPratiquesLieu & {
  id: number;
  nom: string;
  categorie: CategorieLieu;
  /** « Trattoria », « Bar à cocktails »… */
  info?: string | null;
  emoji?: string | null;
  adresse: string | null;
  quartier?: string | null;
  ville: string;
  horaires: string | null;
  texte: string | null;
  /** Prénom de l'ambassadeur qui l'a fait découvrir */
  decouvertPar?: string | null;
  estVerifie: boolean;
};
