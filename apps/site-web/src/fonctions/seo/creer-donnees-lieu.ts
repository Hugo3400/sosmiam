import type { CategorieLieu } from "~/types/lieux";
import type { FichePublique } from "~/types/pro";

/** Le type schema.org de chaque catégorie ; une sortie (bowling, escape game…) reste un commerce local, sans plus de détail */
const TYPES_SCHEMA: Record<CategorieLieu, string> = {
  resto: "Restaurant",
  bar: "BarOrPub",
  patisserie: "Bakery",
  sortie: "LocalBusiness",
};

/** « € » à « €€€€ » : la seule forme de prix reprise telle quelle (rien d'inventé sinon) */
const FOURCHETTE_PRIX = /^€{1,4}$/;

/**
 * Données structurées d'une fiche publique (/lieux/:id) : le type du lieu (Restaurant, BarOrPub, Bakery ou LocalBusiness),
 * son nom, son adresse, son téléphone et ses liens, SEULEMENT ce que la fiche affiche déjà. Pas de note, d'avis ni de position
 * (l'API publique ne les donne pas) ; pas d'image (les fiches n'en ont pas encore).
 */
export function creerDonneesLieu(lieu: FichePublique, adresseFiche: string) {
  const liens = [lieu.siteWeb, lieu.instagram && `https://www.instagram.com/${lieu.instagram}/`].filter(
    (lien): lien is string => typeof lien === "string" && /^https:\/\//.test(lien),
  );
  // Une « adresse » qui n'est que le nom de la ville n'est pas une rue
  const rue = lieu.adresse?.trim() && lieu.adresse.trim().toLowerCase() !== lieu.ville.trim().toLowerCase() ? lieu.adresse.trim() : null;
  return {
    "@context": "https://schema.org",
    "@type": TYPES_SCHEMA[lieu.type] ?? "LocalBusiness",
    "@id": `${adresseFiche}#lieu`,
    name: lieu.nom,
    url: adresseFiche,
    ...(lieu.texte ? { description: lieu.texte } : {}),
    address: {
      "@type": "PostalAddress",
      ...(rue ? { streetAddress: rue } : {}),
      addressLocality: lieu.ville,
      addressCountry: "FR",
    },
    ...(lieu.telephone ? { telephone: lieu.telephone } : {}),
    ...(FOURCHETTE_PRIX.test(lieu.prix) ? { priceRange: lieu.prix } : {}),
    ...(liens.length > 0 ? { sameAs: liens } : {}),
  };
}
