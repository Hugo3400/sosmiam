import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { TEXTES_DONNEES_STRUCTUREES_PAR_LANGUE } from "~/contenus/donnees-structurees";
import { site } from "~/contenus/legal/informations-legales";
import { ecrireCheminLangue } from "~/fonctions/langue/ecrire-chemin-langue";

/**
 * Données structurées « WebSite » (schema.org) de l'accueil : donnent à Google le nom du site à afficher dans ses résultats
 * (« SOS Miam », et ses autres noms). Pas de « SearchAction » : le site n'a pas de vraie page de résultats de recherche.
 */
export function creerDonneesSite(langue: Langue) {
  const adresse = `https://${site.adresse}/`;
  const T = choisirTextes(TEXTES_DONNEES_STRUCTUREES_PAR_LANGUE, langue);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${adresse}#site`,
    name: site.nom,
    alternateName: ["SOS Miam app", "sosmiam"],
    url: `https://${site.adresse}${ecrireCheminLangue("/", langue)}`,
    inLanguage: T.langue,
    publisher: { "@id": `${adresse}#organisation` },
  };
}
