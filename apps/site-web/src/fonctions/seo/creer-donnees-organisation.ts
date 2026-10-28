import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { TEXTES_DONNEES_STRUCTUREES_PAR_LANGUE } from "~/contenus/donnees-structurees";
import { site } from "~/contenus/legal/informations-legales";
import { liensPublics } from "~/contenus/liens-publics";

/** Les profils de la marque (« sameAs ») : seulement les comptes TikTok et Instagram (une invitation Discord n'est pas un profil). */
const PROFILS = new Set(["tiktok", "instagram"]);

/**
 * Données structurées « Organization » (schema.org) de l'accueil : disent à Google que « SOS Miam » est une marque, avec son
 * logo (PNG carré de 512 px, servi par le site) et ses vrais comptes, lus dans contenus/liens-publics.ts.
 */
export function creerDonneesOrganisation(langue: Langue) {
  const adresse = `https://${site.adresse}/`;
  const T = choisirTextes(TEXTES_DONNEES_STRUCTUREES_PAR_LANGUE, langue);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${adresse}#organisation`,
    name: site.nom,
    alternateName: ["sosmiam", "SOS Miam app"],
    url: adresse,
    logo: { "@type": "ImageObject", url: `${adresse}icones/logo-512.png`, width: 512, height: 512 },
    email: site.emailContact,
    description: T.descriptionOrganisation,
    sameAs: liensPublics.filter((lien) => PROFILS.has(lien.reseau)).map((lien) => lien.adresse),
  };
}
