// Envoi d'une notification à un téléphone, directement : Apple (APNs, HTTP/2, jeton ES256) ou Google (FCM v1, jeton
// d'accès OAuth obtenu avec le compte de service). Aucun intermédiaire.
import { connect, type ClientHttp2Session } from "node:http2";

import { signerJetonJwt } from "../../fonctions/notifications/signer-jeton-jwt.ts";
import { lireReglagesApple, lireReglagesGoogle, type ReglagesApple, type ReglagesGoogle } from "./reglages-push.ts";

/**
 * `urgent` : réservé aux alertes Miam Safe (alerte au comptoir, « Prévenir un pote »). Passe les modes Concentration de
 * l'iPhone (« time-sensitive » : capacité cochée sur l'App ID et entitlement dans app.json le 15 octobre, actifs à partir de
 * la première version de l'app construite ensuite), part sur Android dans le canal « miam-safe » de l'app (importance
 * maximale), et porte le repère urgent: "1" (à la racine du message APNs, dans data chez Google) : app ouverte, l'app ne fait
 * sonner qu'une notification qui l'a (et dont le lien est celui d'une alerte Miam Safe).
 * `regroupement` (« conversation:<id> », 64 octets au plus) : une seule notification par conversation à l'écran, la suivante
 * remplace la précédente (apns-collapse-id et thread-id sur iPhone ; tag sur Android, répété dans data : app ouverte, expo
 * prend data.tag comme identifiant de la notification, sinon chaque message s'empilerait).
 * `sonore` (vrai par défaut) : faux pour un message qui arrive moins de 30 s après le dernier de la même conversation qui a
 * sonné chez cette personne ; l'iPhone le montre sans son, Android le range dans le canal « messages-discrets » (muet).
 * `social` : posé par l'applicateur des effets sociaux, et lui seul (messages, groupes, sorties, bande) : canal « messages »
 * sur Android. Tout le reste (campagnes du logiciel, visite revue par l'équipe…) part dans le canal « notifications ».
 */
export type MessagePush = {
  titre: string;
  texte: string;
  lien: string | null;
  urgent?: boolean;
  regroupement?: string;
  sonore?: boolean;
  social?: boolean;
  badge?: number;
};
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

/** Apple limite apns-collapse-id à 64 octets : au-delà, pas de regroupement (la notification part quand même) */
const lireRegroupement = (message: MessagePush) =>
  message.regroupement && Buffer.byteLength(message.regroupement) <= 64 ? message.regroupement : null;

/** Le corps JSON et les en-têtes propres à une notification Apple (sans le jeton ni l'autorisation) */
export function construireEnvoiApple(message: MessagePush): { entetes: Record<string, string>; corps: string } {
  const regroupement = lireRegroupement(message);
  const aps = {
    alert: { title: message.titre, body: message.texte },
    ...(message.sonore === false ? {} : { sound: "default" }),
    ...(regroupement ? { "thread-id": regroupement } : {}),
    ...(message.urgent ? { "interruption-level": "time-sensitive" } : {}),
    ...(message.badge !== undefined ? { badge: message.badge } : {}),
  };
  return {
    entetes: regroupement ? { "apns-collapse-id": regroupement } : {},
    // lien et urgent à la racine : l'app les lit dans trigger.payload (content.data reste vide pour un message qui ne vient
    // pas du service d'Expo)
    corps: JSON.stringify({ aps, ...(message.lien ? { lien: message.lien } : {}), ...(message.urgent ? { urgent: "1" } : {}) }),
  };
}

/**
 * Le canal Android de l'app (creer-canaux-android.ts) : « miam-safe » (importance maximale), « messages-discrets » (la suite
 * d'une rafale, muette), « messages » (son, vibration et bannière) ou « notifications » (son, vibration et bannière, comme
 * les messages : choix de Hugo du 15 octobre 2026)
 */
const lireCanalAndroid = (message: MessagePush) =>
  message.urgent ? "miam-safe" : message.sonore === false ? "messages-discrets" : message.social ? "messages" : "notifications";

/** Le corps d'une notification Google (FCM v1) pour ce téléphone */
export function construireCorpsGoogle(jeton: string, message: MessagePush) {
  const regroupement = lireRegroupement(message);
  const canal = lireCanalAndroid(message);
  return {
    message: {
      token: jeton,
      notification: { title: message.titre, body: message.texte },
      // Aucune clé réservée par FCM (from, message_type, google.…, gcm.…) ; app ouverte, expo lit tag, l'app lit lien et urgent.
      // Limite connue d'expo 57 : app ouverte, ses tâches sont rangées par identifiant (le tag, commun à toute une
      // discussion) ; dans une rafale très serrée, une notification peut ne pas s'afficher (le volet garde la précédente)
      data: {
        ...(message.lien ? { lien: message.lien } : {}),
        ...(regroupement ? { tag: regroupement } : {}),
        ...(message.urgent ? { urgent: "1" } : {}),
      },
      // Le canal est toujours nommé. Sans lui, ou s'il n'existe pas encore sur le téléphone, la notification tomberait dans
      // un canal de repli « Miscellaneous » qui sonne (celui de Firebase app fermée, celui d'expo app ouverte) ; app fermée,
      // Firebase essaie d'abord le canal par défaut du manifeste, « notifications » (app.json). L'app crée ses canaux dès son
      // lancement, avant d'inscrire le téléphone : en pratique, ils existent
      // Android 7 (pas de canaux) : sans ces clés, la notification arriverait sans son, sans vibration ni bannière ;
      // Android 8 et plus les ignore (le canal décide). Rien pour la suite d'une rafale, qui reste muette
      android: {
        priority: "high",
        notification: {
          ...(regroupement ? { tag: regroupement } : {}),
          channel_id: canal,
          ...(canal === "messages-discrets" ? {} : { default_sound: true, default_vibrate_timings: true, notification_priority: canal === "miam-safe" ? "PRIORITY_MAX" : "PRIORITY_HIGH" }),
          ...(message.badge !== undefined ? { notification_count: message.badge } : {}),
        },
      },
    },
  };
}

async function envoyerApple(r: ReglagesApple, jeton: string, message: MessagePush): Promise<ResultatPush> {
  const { entetes, corps } = construireEnvoiApple(message);
  return new Promise((resoudre) => {
    const flux = lireConnexionApple(r.serveur).request({
      ":method": "POST",
      ":path": `/3/device/${encodeURIComponent(jeton)}`,
      authorization: `bearer ${lireJetonApple(r)}`,
      "apns-topic": r.bundle,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
      ...entetes,
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
      body: JSON.stringify(construireCorpsGoogle(jeton, message)),
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
