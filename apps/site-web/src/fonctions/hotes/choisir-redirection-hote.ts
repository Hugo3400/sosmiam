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
/** Pages de l'espace pro (« /recherche-lieux » : les suggestions de « Ton lieu », appelées par /rattacher) */
const PAGES_PRO = ["/bienvenue", "/tableau", "/rattacher", "/recherche-lieux"];
/** Débuts d'adresses de l'espace pro : la fiche d'un lieu et ses pages (« /lieu/12/equipe »…), la demande pour un lieu */
const DEBUTS_PRO = ["/lieu/", "/rattacher/"];
/** Servis sur les deux hôtes, chacun avec son propre contenu (routes/ressources/robots.ts et plan-du-site.ts) */
const FICHIERS_MOTEURS = ["/robots.txt", "/sitemap.xml"];

export type RedirectionHote = { adresse: string; statut: 301 | 302 };

/**
 * Où renvoyer une demande arrivée sur `hote` pour `chemin` (avec ses paramètres) ; null : elle est servie ici.
 * - ambassadeur.sosmiam.fr : « / » → 302 vers /programme ; l'espace est servi ; l'espace pro → 301 vers pro.sosmiam.fr ;
 *   tout le reste → 301 vers sosmiam.fr.
 * - pro.sosmiam.fr : « / » → 302 vers /bienvenue ; l'espace pro et les pages du compte sont servis ; les pages propres à
 *   l'espace ambassadeur → 301 vers lui ; tout le reste → 301 vers sosmiam.fr.
 * - sosmiam.fr : les pages des espaces → 301 vers leur sous-domaine ; tout le reste est servi.
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
