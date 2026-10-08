// Partage des adresses entre sosmiam.fr et ambassadeur.sosmiam.fr, servis par ce même site (middleware de root.tsx).
// Aucun import « ~/… » ici : le test (tests/choisir-redirection-hote.test.ts) lance ce fichier directement avec Node.

/** L'espace ambassadeur (dès 18 ans) a son propre sous-domaine. */
export const HOTE_AMBASSADEUR = "ambassadeur.sosmiam.fr";
const HOTE_SITE = "sosmiam.fr";

/** Pages de l'espace : servies sur ambassadeur.sosmiam.fr, renvoyées vers lui depuis sosmiam.fr */
const PAGES_ESPACE = ["/programme", "/inscription", "/connexion", "/mot-de-passe-oublie", "/nouveau-mot-de-passe", "/espace", "/deconnexion"];
/** Débuts d'adresses de l'espace : les pages connectées et les fichiers du kit média */
const DEBUTS_ESPACE = ["/espace/", "/kit-media/"];
/** Servis sur les deux hôtes, chacun avec son propre contenu (routes/ressources/robots.ts et plan-du-site.ts) */
const FICHIERS_MOTEURS = ["/robots.txt", "/sitemap.xml"];

export type RedirectionHote = { adresse: string; statut: 301 | 302 };

/**
 * Où renvoyer une demande arrivée sur `hote` pour `chemin` (avec ses paramètres) ; null : elle est servie ici.
 * - ambassadeur.sosmiam.fr : « / » → 302 vers /programme ; l'espace est servi ; tout le reste → 301 vers sosmiam.fr.
 * - sosmiam.fr : les pages de l'espace → 301 vers ambassadeur.sosmiam.fr ; tout le reste est servi.
 * - autres hôtes (127.0.0.1, localhost, apercu.sosmiam.fr) : rien n'est renvoyé, pour pouvoir tout essayer.
 * Les demandes de données de React Router (« /espace.data », « /_.data » pour « / ») suivent leur page, sans recopier
 * leurs paramètres techniques (« _routes », « index » vide).
 */
export function choisirRedirectionHote(hote: string, chemin: string): RedirectionHote | null {
  const nomHote = hote.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  if (nomHote !== HOTE_AMBASSADEUR && nomHote !== HOTE_SITE) return null;

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

  if (nomHote === HOTE_SITE) return pageEspace ? { adresse: `https://${HOTE_AMBASSADEUR}${page}${suite}`, statut: 301 } : null;
  if (cle === "/") return { adresse: `/programme${suite}`, statut: 302 };
  if (pageEspace || FICHIERS_MOTEURS.includes(cle)) return null;
  return { adresse: `https://${HOTE_SITE}${page}${suite}`, statut: 301 };
}
