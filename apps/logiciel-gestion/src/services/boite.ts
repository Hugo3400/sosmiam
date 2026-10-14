// Boîte mail (bonjour@sosmiam.fr) : les mails reçus, envoyés (copies des mails partis, même automatiques) et indésirables,
// lus en direct sur le serveur mail (rien n'est gardé ailleurs).
import { appeler, parametres } from "./client-gestion.ts";

export type DossierBoite = "recus" | "envoyes" | "indesirables";
export type Expediteur = { nom: string; adresse: string };
type CompteRelie = { id: number; prenom: string } | null;
/** Une pièce jointe ou une image du mail ; `enLigne` : image affichée dans le mail plutôt que jointe */
export type PieceMessage = { numero: number; nom: string; type: string; taille: number; enLigne: boolean };
export type MessageRecu = {
  uid: number; de: Expediteur; a: Expediteur[]; objet: string; date: string | null; lu: boolean; repondu: boolean; taille: number;
  /** Envoyé par un robot (mail non distribué, ancienne inscription automatique…) */
  automatique: boolean;
  /** Le compte de l'autre personne (l'expéditeur, ou le destinataire d'un mail envoyé) */
  compte: CompteRelie;
};
export type MessageComplet = {
  uid: number; de: Expediteur; a: Expediteur[]; repondreA: Expediteur; objet: string; date: string | null; texte: string;
  /** La version mise en forme (sans script, images intégrées comprises) ; null si le mail n'en a pas */
  html: string | null;
  pieces: PieceMessage[]; compte: CompteRelie;
};

/** Les 50 derniers mails d'un dossier, ou seulement ceux d'une adresse */
export const listerMessagesRecus = (adresse?: string, dossier: DossierBoite = "recus") =>
  appeler<MessageRecu[]>("GET", `/boite${parametres({ adresse: adresse ?? "", dossier })}`);
/** Un mail en entier (un mail reçu devient « lu » dans la boîte) */
export const lireMessageRecu = (uid: number, dossier: DossierBoite = "recus") => appeler<MessageComplet>("GET", `/boite/${uid}${parametres({ dossier })}`);
/** Une pièce jointe ou une image du mail (20 Mo au plus) */
export const lirePieceMessage = (uid: number, numero: number, dossier: DossierBoite) =>
  appeler<Blob>("GET", `/boite/${uid}/pieces/${numero}${parametres({ dossier })}`, { reponse: "blob" });
/** Répond dans le même fil (« Re: … ») depuis bonjour@, et marque le mail « répondu » */
export const repondreMessageRecu = (uid: number, texte: string) => appeler<{ ok: true }>("POST", `/boite/${uid}/repondre`, { corps: { texte } });
