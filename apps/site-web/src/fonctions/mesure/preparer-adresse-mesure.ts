/** Paramètres qui servent aux statistiques de l'API (provenance et campagne : apps/api/src/services/mesure.ts) */
const estParametreMesure = (nom: string) => nom === "ref" || nom.startsWith("utm_");

/**
 * L'adresse d'une page telle qu'elle part vers les statistiques de l'API : le chemin, et parmi les paramètres, seulement
 * « ref » et les « utm_… » (d'où vient la visite, quelle campagne). Jamais un jeton, une recherche ni un e-mail
 * (« /desinscription?jeton=… » → « /desinscription »). Même lecture que React Router pour la navigation dans le site
 * (« /_.data » : l'accueil, « /faq.data » : la FAQ). Invitation entre potes et QR de connexion : ni le pseudo, ni le code,
 * ni aucun paramètre (« /invitation », « /q »).
 */
export function preparerAdresseMesure(adresse: string | URL): string {
  const url = new URL(adresse);
  const chemin = (url.pathname.endsWith("/_.data") ? url.pathname.slice(0, -"_.data".length) : url.pathname.replace(/\.data$/, "")) || "/";
  if (/^\/invitation(\/|$)/i.test(chemin)) return "/invitation";
  if (/^\/q(\/|$)/i.test(chemin)) return "/q";
  const gardes = new URLSearchParams([...url.searchParams].filter(([nom]) => estParametreMesure(nom)));
  const parametres = gardes.toString();
  return parametres ? `${chemin}?${parametres}` : chemin;
}
