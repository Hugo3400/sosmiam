import { useLocation } from "react-router";

import { site as informationsSite } from "~/contenus/legal/informations-legales";

type Props = {
  /** Adresse du site, sans « / » final : https://sosmiam.fr par défaut, https://ambassadeur.sosmiam.fr pour l'espace ambassadeur */
  site?: string;
};

/**
 * Adresse officielle de la page (balise « canonical » et og:url), toujours sur le vrai site et sans paramètres : Google ne
 * compte pas deux fois la même page (aperçu, « ?utm_… », « / » final). React place ces balises dans le <head>.
 */
export function LienCanonique({ site = `https://${informationsSite.adresse}` }: Props) {
  const { pathname } = useLocation();
  const chemin = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  const adresse = `${site}${chemin}`;
  return (
    <>
      <link rel="canonical" href={adresse} />
      <meta property="og:url" content={adresse} />
    </>
  );
}
