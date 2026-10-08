import { useLocation } from "react-router";

import { site } from "~/contenus/legal/informations-legales";

/**
 * Adresse officielle de la page (balise « canonical » et og:url), toujours sur sosmiam.fr et sans paramètres : Google ne
 * compte pas deux fois la même page (aperçu, « ?utm_… », « / » final). React place ces balises dans le <head>.
 */
export function LienCanonique() {
  const { pathname } = useLocation();
  const chemin = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  const adresse = `https://${site.adresse}${chemin}`;
  return (
    <>
      <link rel="canonical" href={adresse} />
      <meta property="og:url" content={adresse} />
    </>
  );
}
