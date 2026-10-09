// Boîte de réception du logiciel de gestion : les mails reçus sur bonjour@sosmiam.fr (réponses aux mails partis du
// logiciel, questions…), lus en IMAP par scripts/lire-boite-mail.py à chaque demande. Rien n'est gardé dans la base ;
// l'expéditeur est relié à son compte SOS Miam quand il en a un. Les réponses partent dans le même fil de discussion.
import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";

import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { envoyerCourrielEcrit } from "../courriels/courriel-ecrit.ts";
import { FICHIER_BOITE_MAIL } from "../courriels/reglages-envoi.ts";

const executer = promisify(execFile);
const SCRIPT = join(import.meta.dirname, "..", "..", "..", "..", "..", "scripts", "lire-boite-mail.py");
/** Le nombre de non-lus (pastille du menu) n'est relu qu'au plus toutes les 5 minutes */
const CACHE_NON_LUS = 5 * 60_000;

export type Expediteur = { nom: string; adresse: string };
export type MessageListe = { uid: number; de: Expediteur; objet: string; date: string | null; lu: boolean; repondu: boolean; taille: number; automatique: boolean };
export type MessageComplet = { uid: number; de: Expediteur; repondreA: Expediteur; objet: string; date: string | null; messageId: string | null; references: string | null; texte: string; pieces: string[] };

/** Lance le script ; « boite-absente » ou « boite-injoignable » si la boîte n'est pas réglée ou ne répond pas. */
async function lancer<T>(...arguments_: string[]): Promise<{ ok: true; donnees: T } | { ok: false; erreur: string }> {
  try {
    const { stdout } = await executer("python3", [SCRIPT, ...arguments_], { timeout: 60_000, maxBuffer: 8 * 1024 * 1024, env: { ...process.env, FICHIER_BOITE_MAIL } });
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

/** Les derniers mails reçus (50 par défaut), éventuellement d'une seule adresse, avec le compte de l'expéditeur. */
export async function listerMessagesRecus(nombre = 50, adresse: string | null = null) {
  const resultat = await lancer<MessageListe[]>("liste", String(nombre), ...(adresse ? [adresse] : []));
  if (!resultat.ok) return resultat;
  const comptes = await relierComptes(resultat.donnees.map((message) => message.de.adresse));
  return { ok: true as const, messages: resultat.donnees.map((message) => ({ ...message, compte: comptes.get(message.de.adresse) ?? null })) };
}

/** Un mail en entier (il est alors marqué comme lu), avec le compte de l'expéditeur. */
export async function lireMessageRecu(uid: number) {
  const resultat = await lancer<MessageComplet | null>("message", String(uid));
  if (!resultat.ok) return resultat;
  if (!resultat.donnees) return { ok: false as const, erreur: "introuvable" };
  dernierCompte = null;
  const comptes = await relierComptes([resultat.donnees.de.adresse, resultat.donnees.repondreA.adresse]);
  return { ok: true as const, message: { ...resultat.donnees, compte: comptes.get(resultat.donnees.de.adresse) ?? comptes.get(resultat.donnees.repondreA.adresse) ?? null } };
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
