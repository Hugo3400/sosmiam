// Statistiques de visite, côté serveur uniquement : le serveur du site signale chaque page vue à l'API, qui n'en garde
// que des totaux (voir apps/api/src/services/mesure.ts et la politique de confidentialité, section « statistiques »).
// Aucun cookie de mesure, aucun script dans le navigateur. Pas comptés : les robots, les préchargements de pages, l'aperçu
// (apercu.sosmiam.fr), les navigateurs qui demandent à ne pas être suivis (signaux GPC et DNT), et les personnes qui
// l'ont demandé sur la page /statistiques (un cookie de refus, posé seulement dans ce cas).
import { isbot } from "isbot";

const ADRESSE_API = process.env.ADRESSE_API ?? "http://127.0.0.1:5192";
/** Seul le vrai site est compté (le serveur de l'aperçu est le même programme) */
const DOMAINE_COMPTE = process.env.DOMAINE_MESURE ?? "sosmiam.fr";

/** Cookie posé par la page /statistiques quand on demande à ne plus être compté (13 mois, comme le veut la CNIL) */
const COOKIE_REFUS = "sosmiam-sans-statistiques";
const DUREE_REFUS = 395 * 24 * 3600;

/** Vrai si le navigateur demande lui-même à ne pas être suivi (Global Privacy Control ou Do Not Track). */
export function aSignalAntiSuivi(requete: Request): boolean {
  return requete.headers.get("sec-gpc") === "1" || requete.headers.get("dnt") === "1";
}

/** Vrai si la personne a demandé, sur la page /statistiques, à ne plus être comptée. */
export function aRefuseStatistiques(requete: Request): boolean {
  return (requete.headers.get("cookie") ?? "").split(";").some((morceau) => morceau.trim() === `${COOKIE_REFUS}=1`);
}

/** En-tête Set-Cookie qui enregistre (ou efface) le refus d'être compté. */
export function creerCookieRefus(refus: boolean): string {
  return `${COOKIE_REFUS}=${refus ? "1" : ""}; Max-Age=${refus ? DUREE_REFUS : 0}; Path=/; SameSite=Lax; Secure; HttpOnly`;
}

/** Signale une page vue à l'API, sans attendre sa réponse : le comptage ne ralentit jamais la page. */
export function signalerVue(requete: Request, reponse: Response): void {
  if (requete.method !== "GET" || reponse.status !== 200) return;
  if (aSignalAntiSuivi(requete) || aRefuseStatistiques(requete)) return;
  const url = new URL(requete.url);
  if (url.hostname !== DOMAINE_COMPTE) return;
  const entetes = requete.headers;
  const signature = entetes.get("user-agent") ?? "";
  if (!signature || isbot(signature)) return;
  if (/prefetch|prerender/i.test(`${entetes.get("sec-purpose") ?? ""} ${entetes.get("purpose") ?? ""}`)) return;
  // Une page complète (HTML), ou une navigation dans le site (données de la page suivante)
  const typeReponse = reponse.headers.get("content-type") ?? "";
  if (!typeReponse.startsWith("text/html") && !typeReponse.startsWith("text/x-script")) return;
  const ip = entetes.get("x-real-ip");
  if (!ip) return;

  // Même lecture que React Router : « /_.data » est l'accueil, « /faq.data » la FAQ
  const chemin = (url.pathname.endsWith("/_.data") ? url.pathname.slice(0, -"_.data".length) : url.pathname.replace(/\.data$/, "")) || "/";
  url.searchParams.delete("_routes");
  const parametres = url.searchParams.toString();
  fetch(`${ADRESSE_API}/mesure/vue`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-IP-Visiteur": ip },
    body: JSON.stringify({
      adressePage: `${chemin}${parametres ? `?${parametres}` : ""}`,
      referent: entetes.get("referer"),
      signature,
      pays: entetes.get("cf-ipcountry"),
    }),
    signal: AbortSignal.timeout(3000),
  }).catch(() => {
    // API arrêtée : la page s'affiche quand même, la vue n'est simplement pas comptée
  });
}
