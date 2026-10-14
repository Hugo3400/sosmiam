import { site } from "~/contenus/legal/informations-legales";
import { liensPublics } from "~/contenus/liens-publics";

/** Les profils de la marque (« sameAs ») : seulement les comptes TikTok et Instagram (une invitation Discord n'est pas un profil). */
const PROFILS = new Set(["tiktok", "instagram"]);

/**
 * Données structurées « Organization » (schema.org) de l'accueil : disent à Google que « SOS Miam » est une marque, avec son
 * logo (PNG carré de 512 px, servi par le site) et ses vrais comptes, lus dans contenus/liens-publics.ts.
 */
export function creerDonneesOrganisation() {
  const adresse = `https://${site.adresse}/`;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${adresse}#organisation`,
    name: site.nom,
    alternateName: ["sosmiam", "SOS Miam app"],
    url: adresse,
    logo: { "@type": "ImageObject", url: `${adresse}icones/logo-512.png`, width: 512, height: 512 },
    email: site.emailContact,
    description:
      "SOS Miam, l'app et le site pour trouver les restos, bars, pâtisseries et sorties indépendants de ton quartier, et donner un coup de main aux lieux en SOS.",
    sameAs: liensPublics.filter((lien) => PROFILS.has(lien.reseau)).map((lien) => lien.adresse),
  };
}
