// Client de l'API de gestion : chaque demande est signée par la clé du poste (voir apps/api/src/middlewares/proteger-gestion.ts).
// La clé (non exportable) et la session ne vivent qu'en mémoire : fermer ou verrouiller le logiciel les oublie.
import { calculerEmpreinteSha256 } from "~/fonctions/securite/calculer-empreinte-sha256.ts";
import { construireMessageGestion } from "~/fonctions/securite/construire-message-gestion.ts";
import { encoderBase64Url } from "~/fonctions/securite/encoder-base64url.ts";
import { signerMessage } from "~/fonctions/securite/signer-message.ts";
import { oublierSessionLocale } from "~/stockage/session-locale.ts";

/** Adresse de l'API de gestion. Pour un essai local : VITE_ADRESSE_API=http://127.0.0.1:5192/api-gestion npm run dev */
export const ADRESSE_API: string = import.meta.env.VITE_ADRESSE_API || "https://sosmiam.fr/api-gestion";

/** Erreur renvoyée par l'API (« code-invalide », « champ-invalide »…), ou « reseau » si elle est injoignable. */
export class ErreurApi extends Error {
  readonly code: string;
  readonly statut: number;
  readonly champ: string | null;
  /** Précision donnée par le serveur (réponse du serveur mail, compte rendu d'une synchronisation…) */
  readonly detail: string | null;
  constructor(code: string, statut: number, champ: string | null = null, detail: string | null = null) {
    super(code);
    this.code = code;
    this.statut = statut;
    this.champ = champ;
    this.detail = detail;
  }
}

const etat: { cleSecrete: CryptoKey | null; idPoste: string | null; session: string | null } = { cleSecrete: null, idPoste: null, session: null };
let quandSessionPerdue: (() => void) | null = null;

export function configurerClient(cleSecrete: CryptoKey | null, idPoste: string | null) {
  etat.cleSecrete = cleSecrete;
  etat.idPoste = idPoste;
}
export function definirSession(session: string | null) {
  etat.session = session;
}
export const aUneSession = () => etat.session !== null;
export const lireSession = () => etat.session;
/** Appelée quand l'API dit que la session est finie (inactivité, redémarrage du serveur) : il faut retaper le code. */
export function surSessionPerdue(rappel: (() => void) | null) {
  quandSessionPerdue = rappel;
}

type Options = {
  /** Corps JSON */
  corps?: unknown;
  /** Fichier envoyé tel quel (médias) */
  fichier?: Blob;
  reponse?: "json" | "texte" | "blob";
  /** Session à utiliser à la place de la session en cours (fermeture d'une session déjà oubliée) */
  session?: string | null;
};

export async function appeler<T>(methode: "GET" | "POST" | "PUT" | "DELETE", chemin: string, options: Options = {}): Promise<T> {
  // Clé, poste et session pris maintenant : un verrouillage pendant la demande ne la casse pas
  const { cleSecrete, idPoste } = etat;
  const session = options.session === undefined ? etat.session : options.session;
  if (!cleSecrete || !idPoste) throw new ErreurApi("verrouille", 0);
  const octets = options.fichier
    ? new Uint8Array(await options.fichier.arrayBuffer())
    : options.corps === undefined ? new Uint8Array() : new TextEncoder().encode(JSON.stringify(options.corps));
  const horodatage = String(Date.now());
  const nonce = encoderBase64Url(crypto.getRandomValues(new Uint8Array(18)));
  const message = construireMessageGestion({
    methode, chemin, horodatage, nonce, session, empreinteCorps: await calculerEmpreinteSha256(octets),
  });
  const entetes: Record<string, string> = {
    "X-Gestion-Poste": idPoste,
    "X-Gestion-Horodatage": horodatage,
    "X-Gestion-Nonce": nonce,
    "X-Gestion-Signature": await signerMessage(cleSecrete, message),
  };
  if (session) entetes["X-Gestion-Session"] = session;
  if (options.fichier) entetes["Content-Type"] = options.fichier.type || "application/octet-stream";
  else if (options.corps !== undefined) entetes["Content-Type"] = "application/json";

  let reponse: Response;
  try {
    reponse = await fetch(`${ADRESSE_API}${chemin}`, { method: methode, headers: entetes, ...(octets.length > 0 ? { body: octets } : {}) });
  } catch {
    throw new ErreurApi("reseau", 0);
  }
  if (!reponse.ok) {
    const corps = (await reponse.json().catch(() => null)) as { erreur?: string; champ?: string; message?: string } | null;
    const erreur = new ErreurApi(corps?.erreur ?? "erreur-serveur", reponse.status, corps?.champ ?? null, corps?.message ?? null);
    if (erreur.code === "session-expiree" && etat.session && etat.session === session) {
      etat.session = null;
      oublierSessionLocale();
      quandSessionPerdue?.();
    }
    throw erreur;
  }
  if (options.reponse === "texte") return (await reponse.text()) as T;
  if (options.reponse === "blob") return (await reponse.blob()) as T;
  return (await reponse.json()) as T;
}

/** Paramètres d'adresse (« ?page=2&recherche=… »), en ignorant les valeurs vides. */
export function parametres(valeurs: Record<string, string | number | boolean | null | undefined>): string {
  const liste = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(valeurs)) {
    if (valeur === undefined || valeur === null || valeur === "" || valeur === false) continue;
    liste.set(cle, valeur === true ? "1" : String(valeur));
  }
  const texte = liste.toString();
  return texte ? `?${texte}` : "";
}
