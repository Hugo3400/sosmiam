// Boîte de réception du logiciel de gestion : les mails reçus sur bonjour@sosmiam.fr (réponses aux mails partis du
// logiciel, questions…), lus en IMAP par scripts/lire-boite-mail.py à chaque demande. Rien n'est gardé dans la base ;
// l'expéditeur est relié à son compte SOS Miam quand il en a un. Les réponses partent dans le même fil de discussion.
import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";

import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { envoyerCourrielEcrit } from "../courriels/courriel-ecrit.ts";
import { FICHIER_BOITE_MAIL } from "../courriels/reglages-envoi.ts";
import type { DossierBoite } from "./dossiers-boite.ts";

const executer = promisify(execFile);
const SCRIPT = join(import.meta.dirname, "..", "..", "..", "..", "..", "scripts", "lire-boite-mail.py");
/** Le nombre de non-lus (pastille du menu) n'est relu qu'au plus toutes les 5 minutes */
const CACHE_NON_LUS = 5 * 60_000;

export type Expediteur = { nom: string; adresse: string };
/** Une pièce jointe, ou une image du mail ; `numero` : sa place dans le mail, pour la demander */
export type PieceMessage = { numero: number; nom: string; type: string; taille: number; enLigne: boolean };
export type MessageListe = { uid: number; de: Expediteur; a: Expediteur[]; objet: string; date: string | null; lu: boolean; repondu: boolean; taille: number; automatique: boolean };
export type MessageComplet = { uid: number; de: Expediteur; a: Expediteur[]; repondreA: Expediteur; objet: string; date: string | null; messageId: string | null; references: string | null; texte: string; pieces: PieceMessage[] };

/** Lance le script ; « boite-absente » ou « boite-injoignable » si la boîte n'est pas réglée ou ne répond pas. */
async function lancer<T>(...arguments_: string[]): Promise<{ ok: true; donnees: T } | { ok: false; erreur: string }> {
  try {
    const { stdout } = await executer("python3", ["-I", SCRIPT, ...arguments_], { timeout: 60_000, maxBuffer: 40 * 1024 * 1024, env: { ...process.env, FICHIER_BOITE_MAIL } });
    return { ok: true, donnees: JSON.parse(stdout) as T };
  } catch (erreur) {
    const sortie = (erreur as { stdout?: string }).stdout ?? "";
    const code = /"erreur": "([a-z-]+)"/.exec(sortie)?.[1];
    return { ok: false, erreur: code ?? "boite-injoignable" };
  }
}

/** Les comptes SOS Miam de ces adresses (pour « Ouvrir sa fiche ») */
async function relierComptes(adresses: string[]) {
  const comptes = await baseDeDonnees.compte.findMany({ where: { email: { in: [...new Set(adresses)] } }, select: { id: true, prenom: true, email: true } });
  return new Map(comptes.map((compte) => [compte.email, { id: compte.id, prenom: compte.prenom }]));
}

/** L'adresse de l'autre personne : l'expéditeur d'un mail reçu, le (premier) destinataire d'un mail envoyé */
const autrePersonne = (message: { de: Expediteur; a: Expediteur[] }, dossier: DossierBoite) =>
  dossier === "envoyes" ? message.a[0]?.adresse ?? "" : message.de.adresse;

/**
 * Les derniers mails d'un dossier (50 par défaut), éventuellement d'une seule adresse (expéditeur, ou destinataire pour
 * les envoyés), avec le compte SOS Miam de l'autre personne.
 */
export async function listerMessagesRecus(nombre = 50, adresse: string | null = null, dossier: DossierBoite = "recus") {
  const resultat = await lancer<MessageListe[]>("liste", dossier, String(nombre), ...(adresse ? [adresse] : []));
  if (!resultat.ok) return resultat;
  const comptes = await relierComptes(resultat.donnees.map((message) => autrePersonne(message, dossier)));
  return { ok: true as const, messages: resultat.donnees.map((message) => ({ ...message, compte: comptes.get(autrePersonne(message, dossier)) ?? null })) };
}

/** Un mail en entier (un mail reçu est alors marqué comme lu), avec le compte de l'autre personne. */
export async function lireMessageRecu(uid: number, dossier: DossierBoite = "recus") {
  const resultat = await lancer<MessageComplet | null>("message", dossier, String(uid));
  if (!resultat.ok) return resultat;
  if (!resultat.donnees) return { ok: false as const, erreur: "introuvable" };
  dernierCompte = null;
  const message = resultat.donnees;
  const comptes = await relierComptes([autrePersonne(message, dossier), message.repondreA.adresse]);
  return { ok: true as const, message: { ...message, compte: comptes.get(autrePersonne(message, dossier)) ?? comptes.get(message.repondreA.adresse) ?? null } };
}

/** Une pièce jointe ou une image d'un mail (20 Mo au plus) */
export async function lirePieceMessage(uid: number, numero: number, dossier: DossierBoite = "recus") {
  const resultat = await lancer<{ nom: string; type: string; contenu: string } | { erreur: string } | null>("piece", dossier, String(uid), String(numero));
  if (!resultat.ok) return resultat;
  if (!resultat.donnees) return { ok: false as const, erreur: "introuvable" };
  if ("erreur" in resultat.donnees) return { ok: false as const, erreur: resultat.donnees.erreur };
  const { nom, type, contenu } = resultat.donnees;
  return { ok: true as const, nom, type, contenu: Buffer.from(contenu, "base64") };
}

/** Répond à un mail reçu, dans le même fil (« Re: … »), puis le marque « répondu » dans la boîte. */
export async function repondreMessageRecu(uid: number, texte: string) {
  const lu = await lireMessageRecu(uid);
  if (!lu.ok) return lu;
  const { message } = lu;
  const objet = /^re\s*:/i.test(message.objet) ? message.objet : `Re: ${message.objet}`.slice(0, 150);
  const envoi = await envoyerCourrielEcrit({ adresse: message.repondreA.adresse }, objet, texte, message.messageId ? { messageId: message.messageId, references: message.references } : undefined);
  if (!envoi.ok) return envoi;
  await lancer("repondu", String(uid));
  return { ok: true as const };
}

let dernierCompte: { nonLus: number | null; moment: number } | null = null;

/** Nombre de mails pas encore lus (pastille du menu) ; null si la boîte n'est pas joignable. Relu toutes les 5 minutes au plus. */
export async function compterNonLus(maintenant = Date.now()): Promise<number | null> {
  if (dernierCompte && maintenant - dernierCompte.moment < CACHE_NON_LUS) return dernierCompte.nonLus;
  const resultat = await lancer<{ nonLus: number }>("non-lus");
  dernierCompte = { nonLus: resultat.ok ? resultat.donnees.nonLus : null, moment: maintenant };
  return dernierCompte.nonLus;
}
