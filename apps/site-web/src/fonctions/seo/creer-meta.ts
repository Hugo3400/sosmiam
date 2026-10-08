type InfosPage = {
  titre: string;
  description: string;
};

// Les réseaux sociaux demandent une adresse complète pour l'image d'aperçu
const ADRESSE_SITE = "https://sosmiam.fr";

/** Construit les balises meta d'une page (titre, description, aperçu pour les réseaux sociaux). */
export function creerMeta({ titre, description }: InfosPage) {
  const titreComplet = titre === "SOS Miam" ? titre : `${titre} — SOS Miam`;
  return [
    { title: titreComplet },
    { name: "description", content: description },
    { property: "og:title", content: titreComplet },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:locale", content: "fr_FR" },
    { property: "og:site_name", content: "SOS Miam" },
    // Bannière grand public du kit de marque : la mascotte et « Sauve une table, régale-toi. »
    { property: "og:image", content: `${ADRESSE_SITE}/images/partage-reseaux.png` },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: "SOS Miam : sauve une table, régale-toi. La bouée mascotte sourit sur fond jaune." },
    { name: "twitter:card", content: "summary_large_image" },
  ];
}
