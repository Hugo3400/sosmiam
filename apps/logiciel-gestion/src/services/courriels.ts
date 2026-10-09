import { appeler, parametres } from "./client-gestion.ts";

/** Réglages de la boîte bonjour@ : « pret », ou ce qui manque (fichier absent, mal protégé, incomplet) */
export type EtatReglagesEnvoi = "pret" | "absent" | "mal-protege" | "incomplet";
export type EtatEnvois = {
  reglages: EtatReglagesEnvoi;
  expediteur: string | null;
  serveur: string | null;
  parHeure: number | null;
  enAttente: number;
  derniereHeure: number;
  echecs7Jours: number;
  dernierEnvoi: string | null;
  /** Identifiants refusés… : tous les mails attendent que le fichier de la boîte soit corrigé */
  probleme: { message: string; moment: string } | null;
};
/** À qui : les inscrits de la newsletter (filtrés), ou les ambassadeurs */
export type PublicEnvoi =
  | { public: "newsletter"; ville: string; candidats: boolean; beta: boolean; telephone: "" | "iphone" | "android" }
  | { public: "ambassadeurs"; statut: "actif" | "tous"; ville: string };
export type Destinataire = { adresse: string; ville: string; detail: string };
export type Campagne = {
  id: number;
  brouillonId: number | null;
  objet: string;
  public: "newsletter" | "ambassadeurs";
  description: string;
  ville: string | null;
  total: number;
  creeLe: string;
  statuts: Partial<Record<"en-attente" | "envoye" | "echec" | "annule", number>>;
};
export type EnvoiRecent = {
  id: number;
  type: string;
  destinataire: string;
  objet: string | null;
  statut: "en-attente" | "envoye" | "echec" | "annule";
  essais: number;
  erreur: string | null;
  creeLe: string;
  envoyeLe: string | null;
};
export type ContenuNewsletter = { objet: string; html: string; texte: string };

export const lireEtatEnvois = () => appeler<EtatEnvois>("GET", "/courriels/etat");
export const listerDerniersEnvois = () => appeler<EnvoiRecent[]>("GET", "/courriels/derniers");
export const envoyerEssai = (adresse: string, contenu: ContenuNewsletter) => appeler<{ ok: true }>("POST", "/courriels/essai", { corps: { adresse, ...contenu } });
/** Le public choisi, adresse par adresse (synchronisee : faux si la liste des inscrits n'a jamais été synchronisée) */
export const listerDestinataires = (cible: PublicEnvoi) =>
  appeler<{ synchronisee: boolean; destinataires: Destinataire[] }>("GET", `/newsletter/destinataires${parametres(cible)}`);
/** adresses : celles cochées (le serveur ne garde que celles du public) */
export const lancerEnvoi = (envoi: PublicEnvoi & ContenuNewsletter & { adresses: string[]; description: string; brouillonId: number | null }) =>
  appeler<{ ok: true; id: number; total: number }>("POST", "/newsletter/envois", { corps: envoi });
export const listerCampagnes = () => appeler<Campagne[]>("GET", "/newsletter/envois");
export const annulerCampagne = (id: number) => appeler<{ ok: true; annules: number }>("POST", `/newsletter/envois/${id}/annuler`, { corps: {} });

/** À qui écrire : un compte (son adresse est relue sur le serveur), ou une adresse (contact d'une demande de lieu…) */
export type DestinataireMail = { compteId: number } | { adresse: string };
/** Un mail écrit dans le logiciel, envoyé tout de suite par bonjour@sosmiam.fr (la personne répond à cette adresse) */
export const ecrireCourriel = (destinataire: DestinataireMail, objet: string, texte: string) =>
  appeler<{ ok: true }>("POST", "/courriels/ecrire", { corps: { ...destinataire, objet, texte } });
