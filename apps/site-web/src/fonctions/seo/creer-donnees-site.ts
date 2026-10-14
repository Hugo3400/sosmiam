import { site } from "~/contenus/legal/informations-legales";

/**
 * Données structurées « WebSite » (schema.org) de l'accueil : donnent à Google le nom du site à afficher dans ses résultats
 * (« SOS Miam », et ses autres noms). Pas de « SearchAction » : le site n'a pas de vraie page de résultats de recherche.
 */
export function creerDonneesSite() {
  const adresse = `https://${site.adresse}/`;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${adresse}#site`,
    name: site.nom,
    alternateName: ["SOS Miam app", "sosmiam"],
    url: adresse,
    inLanguage: "fr-FR",
    publisher: { "@id": `${adresse}#organisation` },
  };
}
