// Espace pro (docs/decisions.md, « Espace pro ») : les formes échangées, les limites et ce que les routes demandent aux
// données. Sans accès à la base : lu aussi par le double en mémoire (pro-en-memoire.ts). Prisma : pro.ts.
import type { CarteLieu } from "../../../../packages/commun/src/types/carte.ts";
import type { FicheSuggerable, NouvelleSuggestionCompte, ResultatSuggestionCompte } from "./suggestions-comptes-regles.ts";

export type RoleRattachement = "gerant" | "equipe";
export type StatutRattachement = "en-attente" | "valide" | "refuse" | "retire";

/** Par compte : 5 demandes de rattachement (rôle « gerant ») par 24 heures glissantes */
export const DEMANDES_RATTACHEMENT_PAR_JOUR = 5;
/** Par lieu : 10 invitations dans l'équipe par 24 heures glissantes */
export const INVITATIONS_PAR_JOUR = 10;
/** Par lieu : 30 membres d'équipe au plus (invités ou validés) */
export const MEMBRES_EQUIPE_MAX = 30;
/** Résultats de « Chercher mon lieu » */
export const RESULTATS_RECHERCHE = 10;
/** Suggestions montrées au lieu (les plus récentes) */
export const SUGGESTIONS_MONTREES = 100;
export const UN_JOUR_PRO = 24 * 3600_000;
/** Demande de rattachement refusée, ou rattachement retiré (preuve, SIRET, réponse) : effacé 1 an après la décision ou le
 * retrait, par le ménage de nuit (décision de Hugo du 9 octobre 2026) ; en attente ou validé, il est gardé */
export const GARDE_RATTACHEMENT_CLOS = 365 * UN_JOUR_PRO;

/** Les champs que le gérant change tout de suite (colonnes de Lieu du même nom) */
export const CHAMPS_DIRECTS = [
  "horaires", "texte", "telephone", "siteWeb", "instagram",
  "animaux", "accessible", "terrasse", "wifi", "enfants", "parking", "paiements", "reservation",
] as const;
/** Les champs qui passent par l'équipe (suggestion « pro ») */
export const CHAMPS_PAR_EQUIPE = ["nom", "adresse"] as const;
export type ChampDirect = (typeof CHAMPS_DIRECTS)[number];
export type ChampParEquipe = (typeof CHAMPS_PAR_EQUIPE)[number];
export type ValeursDirectes = Partial<Record<ChampDirect, string | boolean | string[] | null>>;

/** Un rattachement vu par son compte (GET /comptes/moi/rattachements) */
export type RattachementVu = {
  id: number; lieuId: number; nom: string; ville: string; emoji: string;
  role: RoleRattachement; statut: StatutRattachement;
  /** Réponse de l'équipe (refus, validation), ou null */
  reponse: string | null;
  creeLe: string; decideLe: string | null;
};

/** `compte.pro.lieux` : tous ses rattachements sauf « retire » */
export type LieuDuPro = { lieuId: number; nom: string; ville: string; role: RoleRattachement; statut: StatutRattachement };

/** Un résultat de « Chercher mon lieu » : rien de privé (ni note, ni adresse, ni contact) */
export type LieuTrouve = {
  id: number; nom: string; emoji: string; type: string; quartier: string; ville: string;
  statut: "publie" | "brouillon"; estVerifie: boolean;
};

/** La fiche telle que le pro la voit et la modifie (jamais la note interne de l'équipe) */
export type FichePro = FicheSuggerable & {
  id: number; type: string; emoji: string; info: string; quartier: string; ville: string;
  statut: string; estVerifie: boolean;
};

/** Une suggestion sur le lieu, sans l'identité de son auteur */
export type SuggestionVue = {
  id: number; source: "client" | "pro";
  champs: string[];
  avant: Record<string, unknown>;
  proposition: Record<string, unknown>;
  message: string | null;
  statut: string; champsAcceptes: string[];
  /** Réponse de l'équipe : seulement pour les suggestions du lieu lui-même (celle d'un client lui est adressée) */
  reponse: string | null;
  creeLe: string; decideLe: string | null;
};

/** Un membre de l'équipe (GET /pro/lieux/:id/equipe) */
export type MembreEquipe = {
  compteId: number; prenom: string;
  /** L'e-mail des membres « equipe » (le gérant l'a tapé pour l'inviter) ; null pour un gérant */
  email: string | null;
  role: RoleRattachement; statut: "en-attente" | "valide";
  creeLe: string; decideLe: string | null;
};

/**
 * La carte d'un lieu telle qu'elle est gardée (colonnes carte et carteMajLe de Lieu) : la carte vérifiée par
 * validerCarteDuLieu (packages/commun), sans date (la date est à part, posée par le serveur) ; null : pas de carte.
 */
export type CarteGardee = { carte: Omit<CarteLieu, "majLe"> | null; majLe: Date | null };

export type DemandeRattachement = { lieuId: number; preuve: string; siret: string | null };
export type ResultatDemande = { ok: true; id: number } | { ok: false; erreur: "lieu-inconnu" | "deja-demande" | "trop-de-demandes" };
export type ResultatInvitation = { ok: true } | { ok: false; erreur: "compte-inconnu" | "deja-membre" | "trop-d-invitations" | "equipe-complete" };
export type ModificationFichePro = {
  /** Champs changés tout de suite (null, "" ou [] : info effacée) */
  directs: ValeursDirectes;
  /** Nom et adresse proposés à l'équipe, ou null */
  suggestion: Omit<NouvelleSuggestionCompte, "lieuId"> | null;
};
export type ResultatModificationFiche = { ok: true; suggestionId: number | null } | Extract<ResultatSuggestionCompte, { ok: false }>;

/** Ce que les routes de l'espace pro demandent aux données : services/pro.ts (Prisma), ou la mémoire (tests, démo). */
export type ServicesPro = {
  listerRattachements: (compteId: number) => Promise<RattachementVu[]>;
  /** Demande « gerant » : lieu absent ou masqué, demande en attente ou validée, ou 5 demandes en 24 h : refusée */
  demanderRattachement: (compteId: number, demande: DemandeRattachement, maintenant: Date) => Promise<ResultatDemande>;
  /** L'employé accepte son invitation (rattachement « equipe » « en-attente ») ; faux sinon */
  accepterInvitation: (compteId: number, rattachementId: number, maintenant: Date) => Promise<boolean>;
  /** Le compte refuse une invitation, annule sa demande ou quitte un lieu (→ « retire ») ; faux sinon */
  quitterRattachement: (compteId: number, rattachementId: number, maintenant: Date) => Promise<boolean>;
  /** Lieux publiés ou en brouillon dont le nom ou la ville contient chacun des mots */
  chercherLieux: (mots: string[]) => Promise<LieuTrouve[]>;
  /** Le rôle validé du compte sur ce lieu, ou null */
  lireRole: (compteId: number, lieuId: number) => Promise<RoleRattachement | null>;
  lireFichePro: (lieuId: number) => Promise<FichePro | null>;
  /** Champs directs écrits et suggestion « pro » créée ensemble ; rien n'est fait si la suggestion dépasse les limites */
  modifierFichePro: (compteId: number, lieuId: number, modification: ModificationFichePro, maintenant: Date) => Promise<ResultatModificationFiche>;
  listerSuggestionsDuLieu: (lieuId: number) => Promise<SuggestionVue[]>;
  /** La carte du lieu ; null si le lieu n'existe pas */
  lireCarte: (lieuId: number) => Promise<CarteGardee | null>;
  /** Remplace la carte (déjà vérifiée) et pose sa date ; null efface la carte et sa date. Faux si le lieu n'existe pas */
  enregistrerCarte: (lieuId: number, carte: Omit<CarteLieu, "majLe"> | null, maintenant: Date) => Promise<boolean>;
  listerEquipe: (lieuId: number) => Promise<MembreEquipe[]>;
  inviterMembre: (lieuId: number, inviteurId: number, email: string, maintenant: Date) => Promise<ResultatInvitation>;
  /** Un membre « equipe » retiré par le gérant ; faux s'il n'y est pas */
  retirerMembre: (lieuId: number, compteId: number, maintenant: Date) => Promise<boolean>;
};
