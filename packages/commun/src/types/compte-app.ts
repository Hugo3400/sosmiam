// Le compte unique tel que l'API le rend à l'app (GET /comptes/session, routes/comptes.ts de l'API), et le profil de l'app
// gardé sur le serveur (GET /comptes/moi/profil). Le nom et la date de naissance y sont chiffrés ; l'app ne reçoit que
// l'âge et ce qu'elle affiche.

import type { RoleLieu, StatutAmbassadeur } from "./roles.ts";

/** Un lieu de l'espace pro du compte (rattachement) */
export type LieuDuCompte = { lieuId: number; nom: string; ville: string; emoji: string; role: RoleLieu; statut: "en-attente" | "valide" | "refuse" | "retire" };

export type CompteApp = {
  prenom: string;
  email: string;
  points: number;
  /** « curieux », « denicheur », « ambassadeur-quartier » ou « ambassadeur-ville » */
  palier: string;
  badges: string[];
  creeLe: string;
  emailVerifie: boolean;
  /** Âge au jour de Paris (comptes de l'app) ; null pour un compte du site, qui a 18 ans ou plus */
  age: number | null;
  /** null : pas d'ambassadeur (ou moins de 18 ans) */
  ambassadeur: { statut: StatutAmbassadeur; ville: string; quartier: string | null; decideLe: string | null; certifie: unknown | null } | null;
  /** Vides sous 18 ans ; lieuxValides : les lieux qui sont à lui */
  pro: { lieux: LieuDuCompte[]; lieuxValides: LieuDuCompte[] };
};

/** Le profil de l'app gardé sur le serveur ; null : pas connu (un compte du site n'a ni date ni ville de profil) */
export type ProfilServeur = {
  prenom: string;
  nom: string | null;
  pseudo: string | null;
  dateNaissance: string | null;
  ville: string | null;
  envies: Record<string, string[]>;
  avatar: string | null;
  prive: boolean;
  emailVerifie: boolean;
  age: number | null;
};

/** Ce que « Fais connaissance » envoie (inscription par e-mail, ou pour compléter une connexion Apple ou Google) */
export type ProfilInscription = {
  prenom: string;
  nom?: string | null;
  /** « AAAA-MM-JJ » */
  dateNaissance: string;
  ville: string;
  envies?: Record<string, string[]>;
  pseudo?: string | null;
};

export type InscriptionEmail = ProfilInscription & { email: string; motDePasse: string; cgu: true };

/** La réponse d'Apple ou de Google, et ce qu'on sait déjà du profil (Apple ne donne le nom qu'à la première connexion) */
export type ConnexionExterne =
  | { fournisseur: "apple"; identityToken: string; nonce: string; profil?: Partial<ProfilInscription> & { cgu?: true } }
  | { fournisseur: "google"; idToken: string; nonce?: string; profil?: Partial<ProfilInscription> & { cgu?: true } };

/** Ce qu'il manque pour créer le compte après Apple ou Google, et ce qu'on peut déjà pré-remplir */
export type ProfilACompleter = { manque: ("prenom" | "dateNaissance" | "ville" | "cgu")[]; prefill: { email: string; prenom?: string; nom?: string } };

/** Comment le compte se connecte : de quoi confirmer « Supprimer mon compte » */
export type ConnexionsCompte = { motDePasse: boolean; apple: boolean; google: boolean };
