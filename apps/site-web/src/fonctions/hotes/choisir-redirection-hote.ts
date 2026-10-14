// Partage des adresses entre sosmiam.fr, ambassadeur.sosmiam.fr et pro.sosmiam.fr, servis par ce même site (middleware de
// root.tsx).
// Aucun import « ~/… » ici : le test (tests/choisir-redirection-hote.test.ts) lance ce fichier directement avec Node.

/** L'espace ambassadeur (dès 18 ans) a son propre sous-domaine. */
export const HOTE_AMBASSADEUR = "ambassadeur.sosmiam.fr";
/** L'espace pro (les lieux gèrent leur fiche) a aussi le sien. */
export const HOTE_PRO = "pro.sosmiam.fr";
const HOTE_SITE = "sosmiam.fr";

/**
 * Pages de l'espace : servies sur ambassadeur.sosmiam.fr, renvoyées vers lui depuis sosmiam.fr (« /communes » : les
 * suggestions de « Ta ville », appelées par le programme et la candidature de fondateur)
 */
const PAGES_ESPACE = [
  "/programme", "/inscription", "/connexion", "/mot-de-passe-oublie", "/nouveau-mot-de-passe", "/verifier-email", "/espace", "/deconnexion", "/communes",
];
/** Débuts d'adresses de l'espace : les pages connectées et les fichiers du kit média (et du kit média pro) */
const DEBUTS_ESPACE = ["/espace/", "/kit-media/", "/kit-media-pro/"];
/** Pages du compte, servies aussi sur pro.sosmiam.fr (un seul compte SOS Miam, mais un cookie par hôte) */
const PAGES_COMPTE = ["/inscription", "/connexion", "/mot-de-passe-oublie", "/nouveau-mot-de-passe", "/verifier-email", "/deconnexion"];
/** Pages de l'espace pro (« /recherche-lieux » : les suggestions de « Ton lieu », appelées par /rattacher ; « /mon-compte » :
 * la page « Mon compte » de l'espace pro, qui est /espace/mon-compte dans l'espace ambassadeur) */
const PAGES_PRO = ["/bienvenue", "/tableau", "/rattacher", "/recherche-lieux", "/mon-compte"];
/** Débuts d'adresses de l'espace pro : la fiche d'un lieu et ses pages (« /lieu/12/equipe »…), la demande pour un lieu, et
 * les fichiers du kit média des lieux */
const DEBUTS_PRO = ["/lieu/", "/rattacher/", "/kit-media-lieux/"];
/**
 * Pages du compte servies aussi sur sosmiam.fr (avec le cookie de sosmiam.fr) : « Mon compte » du site principal, adresse
 * donnée aux stores pour demander la suppression d'un compte (connexion dans la page même), et la déconnexion qui va avec
 */
const PAGES_COMPTE_SITE = ["/mon-compte", "/deconnexion"];
/**
 * « Continuer avec Apple / Google » : départ, retour (adresses exactes déclarées chez Apple et Google pour CHAQUE hôte :
 * https://<hôte>/connexion/apple/retour et /connexion/google/retour) et « Finir ton inscription », servis sur les trois
 * hôtes, chacun avec son cookie de session
 */
const DEBUT_CONNEXION_EXTERNE = "/connexion/";
/**
 * Fichiers d'association des apps (/.well-known/apple-app-site-association, assetlinks.json) : jamais redirigés (Apple ne
 * suit pas les redirections) ; la route répond elle-même, 200 sur sosmiam.fr et 404 ailleurs
 */
const DEBUT_WELL_KNOWN = "/.well-known/";
/**
 * Choix des cookies envoyé par le bandeau (POST /cookies/choix, routes/ressources/choix-cookies.ts) : servi sur les trois
 * hôtes, sans redirection (une redirection 301 ferait perdre le POST, donc le choix)
 */
const CHOIX_COOKIES = "/cookies/choix";
/** Servis sur les deux hôtes, chacun avec son propre contenu (routes/ressources/robots.ts et plan-du-site.ts) */
const FICHIERS_MOTEURS = ["/robots.txt", "/sitemap.xml"];

export type RedirectionHote = { adresse: string; statut: 301 | 302 };

/**
 * Où renvoyer une demande arrivée sur `hote` pour `chemin` (avec ses paramètres) ; null : elle est servie ici.
 * - ambassadeur.sosmiam.fr : « / » → 302 vers /programme ; « /mon-compte » → 302 vers /espace/mon-compte (sa page
 *   « Mon compte », avec le cookie de cet hôte) ; l'espace est servi ; l'espace pro → 301 vers pro.sosmiam.fr ; tout le
 *   reste → 301 vers sosmiam.fr.
 * - pro.sosmiam.fr : « / » → 302 vers /bienvenue ; l'espace pro et les pages du compte sont servis ; les pages propres à
 *   l'espace ambassadeur → 301 vers lui ; tout le reste → 301 vers sosmiam.fr.
 * - sosmiam.fr : « /mon-compte » et « /deconnexion » sont servis (le « Mon compte » du site, avec son propre cookie) ;
 *   les autres pages des espaces → 301 vers leur sous-domaine ; tout le reste est servi, dont les QR de vitrine
 *   /l/<code> (ailleurs, ils suivent « tout le reste » : 301 vers sosmiam.fr, où le QR imprimé mène de toute façon).
 * - partout : « /.well-known/… » est servi tel quel (la route choisit 200 ou 404) ;
 * - partout : « /connexion/… » (Apple et Google, et « Finir ton inscription ») est servi, sans redirection : Apple et
 *   Google reviennent sur l'hôte de départ, par un POST qu'une redirection perdrait.
 * - partout : « /cookies/choix » (le choix des cookies du bandeau, en POST) est servi, sans redirection.
 * - autres hôtes (127.0.0.1, localhost, pro.localhost, apercu.sosmiam.fr) : rien n'est renvoyé, pour pouvoir tout essayer.
 * Les demandes de données de React Router (« /espace.data », « /_.data » pour « / ») suivent leur page, sans recopier
 * leurs paramètres techniques (« _routes », « index » vide).
 */
export function choisirRedirectionHote(hote: string, chemin: string): RedirectionHote | null {
  const nomHote = hote.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  if (nomHote !== HOTE_AMBASSADEUR && nomHote !== HOTE_PRO && nomHote !== HOTE_SITE) return null;

  // Découpe à la main (et non avec new URL) : « //exemple.fr » doit rester un chemin, pas devenir une autre adresse
  const debutParametres = chemin.indexOf("?");
  let page = debutParametres === -1 ? chemin : chemin.slice(0, debutParametres);
  if (/\/_(root)?\.data$/.test(page)) page = page.slice(0, page.lastIndexOf("/") + 1);
  else if (page.endsWith(".data")) page = page.slice(0, -".data".length);
  if (!page.startsWith("/")) page = `/${page}`;

  const parametres = new URLSearchParams(debutParametres === -1 ? "" : chemin.slice(debutParametres + 1));
  const index = parametres.getAll("index").filter(Boolean);
  parametres.delete("_routes");
  parametres.delete("index");
  for (const valeur of index) parametres.append("index", valeur);
  const texteParametres = parametres.toString();
  const suite = texteParametres ? `?${texteParametres}` : "";

  // Comparaison sans majuscules, sans « / » final et avec les caractères décodés, comme le fait React Router
  let cle = page;
  try {
    cle = decodeURIComponent(page);
  } catch {
    // Encodage invalide : on compare tel quel
  }
  cle = cle.toLowerCase().replace(/\/+$/, "") || "/";
  const pageEspace = PAGES_ESPACE.includes(cle) || DEBUTS_ESPACE.some((debut) => cle.startsWith(debut));
  const pagePro = PAGES_PRO.includes(cle) || DEBUTS_PRO.some((debut) => cle.startsWith(debut));
  const vers = (hoteCible: string) => ({ adresse: `https://${hoteCible}${page}${suite}`, statut: 301 as const });

  if (cle.startsWith(DEBUT_CONNEXION_EXTERNE)) return null;
  if (cle.startsWith(DEBUT_WELL_KNOWN)) return null;
  if (cle === CHOIX_COOKIES) return null;
  if (nomHote === HOTE_SITE && PAGES_COMPTE_SITE.includes(cle)) return null;
  if (cle === "/mon-compte" && nomHote === HOTE_AMBASSADEUR) return { adresse: `/espace/mon-compte${suite}`, statut: 302 };
  if (pagePro && nomHote !== HOTE_PRO) return vers(HOTE_PRO);
  if (nomHote === HOTE_SITE) return pageEspace ? vers(HOTE_AMBASSADEUR) : null;
  if (nomHote === HOTE_PRO) {
    if (cle === "/") return { adresse: `/bienvenue${suite}`, statut: 302 };
    if (pagePro || PAGES_COMPTE.includes(cle) || FICHIERS_MOTEURS.includes(cle)) return null;
    return vers(pageEspace ? HOTE_AMBASSADEUR : HOTE_SITE);
  }
  if (cle === "/") return { adresse: `/programme${suite}`, statut: 302 };
  if (pageEspace || FICHIERS_MOTEURS.includes(cle)) return null;
  return vers(HOTE_SITE);
}
