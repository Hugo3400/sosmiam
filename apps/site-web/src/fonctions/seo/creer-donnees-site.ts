import { site } from "~/contenus/legal/informations-legales";

/** Données structurées « WebSite » (schema.org) de l'accueil : donnent à Google le nom du site à afficher dans ses résultats. */
export function creerDonneesSite() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.nom,
    url: `https://${site.adresse}/`,
    inLanguage: "fr-FR",
  };
}
