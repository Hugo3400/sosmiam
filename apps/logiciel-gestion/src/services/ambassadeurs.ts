import { appeler, parametres } from "./client-gestion.ts";

export type StatutAmbassadeur = "en-attente" | "actif" | "refuse" | "suspendu";
export type Palier = "curieux" | "denicheur" | "ambassadeur-quartier" | "ambassadeur-ville";

export type ResumeAmbassadeur = {
  id: number;
  prenom: string;
  email: string;
  points: number;
  palier: Palier;
  creeLe: string;
  derniereConnexion: string;
  ambassadeur: { statut: StatutAmbassadeur; ville: string; quartier: string | null; decideLe: string | null } | null;
  _count: { badges: number; demandesLieux: number };
  /** Sans visite : rôle d'ambassadeur retiré après 1 an, compte effacé après 2 ans ; alerte 30 jours avant le retrait */
  retireLe: string;
  effaceLe: string;
  bientotRetire: boolean;
};
export type ListeAmbassadeurs = { compteurs: Partial<Record<StatutAmbassadeur, number>>; bientotRetires: number; ambassadeurs: ResumeAmbassadeur[] };

export type Mission = {
  id: number;
  compteId: number;
  titre: string;
  detail: string;
  lieuId: number | null;
  echeance: string | null;
  statut: "a-faire" | "faite" | "annulee";
  compteRendu: string | null;
  creeLe: string;
  faiteLe: string | null;
  lieu: { id: number; nom: string; emoji: string } | null;
  compte?: { id: number; prenom: string; ambassadeur: { ville: string } | null };
};
export type MessageAmbassadeurs = {
  id: number;
  compteId: number | null;
  titre: string;
  texte: string;
  creeLe: string;
  compte: { id: number; prenom: string } | null;
  _count: { lectures: number };
  destinataires: number;
};
export type Candidature = {
  id: number;
  compteId: number;
  pepites: string;
  envies: string;
  reseaux: string | null;
  motivation: string;
  partantRencontre: boolean;
  connuPar: string | null;
  statut: "en-attente" | "acceptee" | "refusee";
  numero: number | null;
  creeLe: string;
  reponduLe: string | null;
  compte?: { id: number; prenom: string; email: string; points: number; palier: Palier; ambassadeur: { ville: string; quartier: string | null; statut: StatutAmbassadeur } | null };
};
export type FicheAmbassadeur = Omit<ResumeAmbassadeur, "_count" | "bientotRetire" | "ambassadeur"> & {
  cguVersion: string;
  ambassadeur: { statut: StatutAmbassadeur; ville: string; quartier: string | null; noteEquipe: string | null; decideLe: string | null; creeLe: string } | null;
  badges: { id: number; badge: string; obtenuLe: string }[];
  journalPoints: { id: number; points: number; raison: string; detail: string | null; creeLe: string }[];
  candidatures: Candidature[];
  demandesLieux: { id: number; nom: string; ville: string; statut: string; creeLe: string; lieuId: number | null }[];
  missions: Mission[];
  messages: { id: number; titre: string; texte: string; creeLe: string }[];
  _count: { sessions: number };
};
export type Classement = {
  toujours: { id: number; prenom: string; points: number; palier: Palier; ambassadeur: { ville: string } | null; badges: { badge: string }[] }[];
  mois: { id: number; prenom: string; ville: string; points: number }[];
};
export type Couverture = { ville: string; ambassadeurs: number; lieux: number; quartiers: { quartier: string; ambassadeurs: number }[] }[];

export const listerAmbassadeurs = (filtres: { statut: string; palier: string; recherche: string }) =>
  appeler<ListeAmbassadeurs>("GET", `/ambassadeurs${parametres(filtres)}`);
export const lireAmbassadeur = (id: number) => appeler<FicheAmbassadeur>("GET", `/ambassadeurs/${id}`);
export const deciderAmbassadeur = (id: number, statut: "actif" | "refuse" | "suspendu") =>
  appeler<{ ok: true; bienvenue: boolean }>("POST", `/ambassadeurs/${id}/decision`, { corps: { statut } });
export const modifierAmbassadeur = (id: number, modification: { ville?: string; quartier?: string | null; noteEquipe?: string | null }) =>
  appeler<{ ok: true }>("PUT", `/ambassadeurs/${id}`, { corps: modification });
export const ajouterPoints = (id: number, points: number, detail: string) =>
  appeler<{ ok: true; points: number; palier: Palier }>("POST", `/ambassadeurs/${id}/points`, { corps: { points, detail } });
export const changerPalierVille = (id: number, ville: boolean) => appeler<{ ok: true; palier: Palier }>("POST", `/ambassadeurs/${id}/palier-ville`, { corps: { ville } });
/** envoyer : le serveur l'envoie lui-même à son adresse (le lien ne revient pas) ; sinon, ou si l'envoi rate, le lien revient */
export const reinitialiserMotDePasse = (id: number, envoyer: boolean) =>
  appeler<{ ok: true; envoye: true; expireLe: string } | { ok: true; envoye: false; lien: string; expireLe: string }>("POST", `/ambassadeurs/${id}/reinitialiser`, { corps: { envoyer } });
export const retirerDuProgramme = (id: number) => appeler<{ ok: true }>("POST", `/ambassadeurs/${id}/retirer`, { corps: {} });
/** Supprime tout le compte SOS Miam, app comprise (un seul compte pour l'app, l'espace ambassadeur et l'espace pro) */
export const supprimerCompteAmbassadeur = (id: number) => appeler<{ ok: true }>("DELETE", `/ambassadeurs/${id}`);
export const exporterAmbassadeurs = () => appeler<string>("GET", "/ambassadeurs/export", { reponse: "texte" });
export const lireClassement = () => appeler<Classement>("GET", "/ambassadeurs/classement");
export const lireCouverture = () => appeler<Couverture>("GET", "/ambassadeurs/couverture");

export const listerCandidatures = (statut: string) => appeler<Candidature[]>("GET", `/candidatures${parametres({ statut })}`);
export const accepterCandidature = (id: number) => appeler<{ ok: true; numero: number }>("POST", `/candidatures/${id}/accepter`, { corps: {} });
export const refuserCandidature = (id: number) => appeler<{ ok: true }>("POST", `/candidatures/${id}/refuser`, { corps: {} });

export const listerMissions = (statut: string) => appeler<Mission[]>("GET", `/missions${parametres({ statut })}`);
export const creerMission = (mission: { compteId: number; titre: string; detail: string; lieuId: number | null; echeance: string | null }) =>
  appeler<Mission>("POST", "/missions", { corps: mission });
export const changerStatutMission = (id: number, statut: "a-faire" | "annulee") => appeler<{ ok: true }>("POST", `/missions/${id}/statut`, { corps: { statut } });
export const supprimerMission = (id: number) => appeler<{ ok: true }>("DELETE", `/missions/${id}`);

export const listerMessages = () => appeler<MessageAmbassadeurs[]>("GET", "/messages-ambassadeurs");
export const envoyerMessage = (compteId: number | null, titre: string, texte: string) =>
  appeler<MessageAmbassadeurs>("POST", "/messages-ambassadeurs", { corps: { compteId, titre, texte } });
export const supprimerMessage = (id: number) => appeler<{ ok: true }>("DELETE", `/messages-ambassadeurs/${id}`);
