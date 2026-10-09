// Envoi d'une notification à un téléphone, directement : Apple (APNs, HTTP/2, jeton ES256) ou Google (FCM v1, jeton
// d'accès OAuth obtenu avec le compte de service). Aucun intermédiaire.
import { connect, type ClientHttp2Session } from "node:http2";

import { signerJetonJwt } from "../../fonctions/notifications/signer-jeton-jwt.ts";
import { lireReglagesApple, lireReglagesGoogle, type ReglagesApple, type ReglagesGoogle } from "./reglages-push.ts";

/** `urgent` : passe les modes Concentration de l'iPhone (« time-sensitive ») ; réservé aux alertes Miam Safe */
export type MessagePush = { titre: string; texte: string; lien: string | null; urgent?: boolean };
/** « envoyee », « jeton-invalide » (app désinstallée : on oublie ce téléphone) ou une erreur à réessayer plus tard */
export type ResultatPush = "envoyee" | "jeton-invalide" | { erreur: string };
export type ExpedierPush = (appareil: { jeton: string; plateforme: string }, message: MessagePush) => Promise<ResultatPush>;

// ─── Apple ───

let jetonApple: { valeur: string; cree: number; cle: string } | null = null;
let connexionApple: { session: ClientHttp2Session; serveur: string } | null = null;

/** Le jeton d'Apple se garde 50 minutes (Apple le refuse au-delà d'une heure, et s'il change trop souvent). */
function lireJetonApple(r: ReglagesApple): string {
  const cle = `${r.cleId}:${r.equipeId}`;
  if (jetonApple && jetonApple.cle === cle && Date.now() - jetonApple.cree < 50 * 60_000) return jetonApple.valeur;
  const valeur = signerJetonJwt("ES256", r.cle, { kid: r.cleId }, { iss: r.equipeId, iat: Math.floor(Date.now() / 1000) });
  jetonApple = { valeur, cree: Date.now(), cle };
  return valeur;
}

function lireConnexionApple(serveur: string): ClientHttp2Session {
  if (connexionApple && connexionApple.serveur === serveur && !connexionApple.session.closed && !connexionApple.session.destroyed) return connexionApple.session;
  const session = connect(serveur);
  session.on("error", () => session.destroy());
  session.setTimeout(60_000, () => session.close());
  connexionApple = { session, serveur };
  return session;
}

async function envoyerApple(r: ReglagesApple, jeton: string, message: MessagePush): Promise<ResultatPush> {
  const aps = { alert: { title: message.titre, body: message.texte }, sound: "default", ...(message.urgent ? { "interruption-level": "time-sensitive" } : {}) };
  const corps = JSON.stringify({ aps, ...(message.lien ? { lien: message.lien } : {}) });
  return new Promise((resoudre) => {
    const flux = lireConnexionApple(r.serveur).request({
      ":method": "POST",
      ":path": `/3/device/${encodeURIComponent(jeton)}`,
      authorization: `bearer ${lireJetonApple(r)}`,
      "apns-topic": r.bundle,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    });
    let statut = 0;
    let reponse = "";
    flux.setEncoding("utf8");
    flux.on("response", (entetes) => void (statut = Number(entetes[":status"])));
    flux.on("data", (morceau: string) => void (reponse += morceau));
    flux.on("error", (erreur) => resoudre({ erreur: `réseau : ${erreur.message}`.slice(0, 200) }));
    flux.setTimeout(20_000, () => flux.close());
    flux.on("end", () => {
      if (statut === 200) return resoudre("envoyee");
      const raison = (() => { try { return (JSON.parse(reponse) as { reason?: string }).reason ?? ""; } catch { return ""; } })();
      if (statut === 410 || raison === "BadDeviceToken" || raison === "Unregistered" || raison === "DeviceTokenNotForTopic") return resoudre("jeton-invalide");
      resoudre({ erreur: `Apple ${statut || "sans réponse"} ${raison}`.trim().slice(0, 200) });
    });
    flux.end(corps);
  });
}

// ─── Google ───

let jetonGoogle: { valeur: string; expire: number; email: string } | null = null;

async function lireJetonGoogle(r: ReglagesGoogle): Promise<string> {
  if (jetonGoogle && jetonGoogle.email === r.email && Date.now() < jetonGoogle.expire - 60_000) return jetonGoogle.valeur;
  const maintenant = Math.floor(Date.now() / 1000);
  const assertion = signerJetonJwt("RS256", r.cle, {}, {
    iss: r.email, scope: "https://www.googleapis.com/auth/firebase.messaging", aud: "https://oauth2.googleapis.com/token", iat: maintenant, exp: maintenant + 3600,
  });
  const reponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    signal: AbortSignal.timeout(20_000),
  });
  const donnees = (await reponse.json()) as { access_token?: string; expires_in?: number; error?: string };
  if (!reponse.ok || !donnees.access_token) throw new Error(`Google refuse le compte de service : ${donnees.error ?? reponse.status}`);
  jetonGoogle = { valeur: donnees.access_token, expire: Date.now() + (donnees.expires_in ?? 3600) * 1000, email: r.email };
  return donnees.access_token;
}

async function envoyerGoogle(r: ReglagesGoogle, jeton: string, message: MessagePush): Promise<ResultatPush> {
  try {
    const reponse = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(r.projet)}/messages:send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await lireJetonGoogle(r)}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: { token: jeton, notification: { title: message.titre, body: message.texte }, data: message.lien ? { lien: message.lien } : {}, android: { priority: "high" } },
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (reponse.ok) return "envoyee";
    const corps = (await reponse.json().catch(() => ({}))) as { error?: { status?: string; details?: { errorCode?: string }[] } };
    const code = corps.error?.details?.find((d) => d.errorCode)?.errorCode ?? corps.error?.status ?? "";
    // Seul « UNREGISTERED » dit sûrement que le téléphone n'existe plus (INVALID_ARGUMENT peut venir du message)
    if (reponse.status === 404 || code === "UNREGISTERED") return "jeton-invalide";
    return { erreur: `Google ${reponse.status} ${code}`.trim().slice(0, 200) };
  } catch (erreur) {
    return { erreur: String((erreur as Error).message).slice(0, 200) };
  }
}

/** Envoie à un téléphone, selon sa plateforme ; une plateforme pas encore réglée rend une erreur claire. */
export const expedierPush: ExpedierPush = async (appareil, message) => {
  if (appareil.plateforme === "ios") {
    const { reglages } = await lireReglagesApple();
    return reglages ? envoyerApple(reglages, appareil.jeton, message) : { erreur: "Envoi vers Apple pas encore réglé" };
  }
  const { reglages } = await lireReglagesGoogle();
  return reglages ? envoyerGoogle(reglages, appareil.jeton, message) : { erreur: "Envoi vers Google pas encore réglé" };
};
