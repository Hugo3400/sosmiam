// Boîte de réception (bonjour@sosmiam.fr) : les mails reçus, lus en direct sur le serveur mail (rien n'est gardé).
import { appeler, parametres } from "./client-gestion.ts";

export type Expediteur = { nom: string; adresse: string };
type CompteRelie = { id: number; prenom: string } | null;
export type MessageRecu = {
  uid: number; de: Expediteur; objet: string; date: string | null; lu: boolean; repondu: boolean; taille: number;
  /** Envoyé par un robot (mail non distribué, ancienne inscription automatique…) */
  automatique: boolean;
  compte: CompteRelie;
};
export type MessageComplet = {
  uid: number; de: Expediteur; repondreA: Expediteur; objet: string; date: string | null; texte: string; pieces: string[]; compte: CompteRelie;
};

/** Les 50 derniers mails reçus, ou seulement ceux d'une adresse */
export const listerMessagesRecus = (adresse?: string) => appeler<MessageRecu[]>("GET", `/boite${parametres({ adresse: adresse ?? "" })}`);
/** Un mail en entier (il devient « lu » dans la boîte) */
export const lireMessageRecu = (uid: number) => appeler<MessageComplet>("GET", `/boite/${uid}`);
/** Répond dans le même fil (« Re: … ») depuis bonjour@, et marque le mail « répondu » */
export const repondreMessageRecu = (uid: number, texte: string) => appeler<{ ok: true }>("POST", `/boite/${uid}/repondre`, { corps: { texte } });
