import { appeler, parametres } from "./client-gestion.ts";
import type { Palier, StatutAmbassadeur } from "./ambassadeurs.ts";

export type ResumeCompte = {
  id: number;
  prenom: string;
  /** Profil de l'app : pseudo et ville (jamais le nom ni la date de naissance, chiffrés) */
  pseudo?: string | null;
  ville?: string | null;
  email: string;
  /** Adresse confirmée par le lien reçu à l'inscription (null : pas encore) */
  emailVerifieLe: string | null;
  points: number;
  palier: Palier;
  creeLe: string;
  derniereConnexion: string;
  ambassadeur: { statut: StatutAmbassadeur; ville: string } | null;
  _count: { sessions: number };
};
export type ListeComptes = {
  total: number;
  trouves: number;
  parPage: number;
  compteurs: { ambassadeurs: number; actifsSemaine: number };
  comptes: ResumeCompte[];
};
export type FicheCompte = Omit<ResumeCompte, "_count" | "ambassadeur"> & {
  cguVersion: string;
  prive?: boolean | null;
  /** Une date de naissance est enregistrée (chiffrée) : « Afficher » la montre, avec une ligne au journal */
  dateNaissanceRenseignee?: boolean;
  modifieLe: string;
  ambassadeur: { statut: StatutAmbassadeur; ville: string; quartier: string | null; decideLe: string | null } | null;
  badges: { badge: string; obtenuLe: string }[];
  journalPoints: { points: number; raison: string; detail: string | null; creeLe: string }[];
  _count: { demandesLieux: number; missions: number; candidatures: number };
  /** Connexions ouvertes, par support (« site », « app ») */
  sessions: { support: string; nombre: number; derniereActivite: string | null }[];
};
export type FiltresComptes = { recherche: string; role: "" | "ambassadeur" | "sans-role"; page: number };

export const listerComptes = (filtres: FiltresComptes) => appeler<ListeComptes>("GET", `/comptes${parametres(filtres)}`);
export const lireCompte = (id: number) => appeler<FicheCompte>("GET", `/comptes/${id}`);
export const deconnecterCompte = (id: number) => appeler<{ ok: true; fermees: number }>("POST", `/comptes/${id}/deconnecter`, { corps: {} });
/** Toutes ses données (demande d'accès RGPD), en JSON */
export const exporterDonneesCompte = (id: number) => appeler<unknown>("GET", `/comptes/${id}/donnees`);
export const reinitialiserMotDePasseCompte = (id: number, envoyer: boolean) =>
  appeler<{ ok: true; envoye: true; expireLe: string } | { ok: true; envoye: false; lien: string; expireLe: string }>("POST", `/comptes/${id}/reinitialiser`, { corps: { envoyer } });
export const supprimerCompte = (id: number) => appeler<{ ok: true }>("DELETE", `/comptes/${id}`);

/** La date de naissance en clair (« AAAA-MM-JJ ») ; l'affichage est noté au journal de gestion (sans la date) */
export const lireDateNaissance = (id: number) => appeler<{ dateNaissance: string | null }>("GET", `/comptes/${id}/date-naissance`);
/** Correction sur demande de la personne ; sous 18 ans, ses rôles d'ambassadeur et de pro partent */
export const corrigerDateNaissance = (id: number, date: string) =>
  appeler<{ ok: true; rolesRetires: ("ambassadeur" | "pro")[]; majeur: boolean }>("PUT", `/comptes/${id}/date-naissance`, { corps: { date } });
