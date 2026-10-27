import { LANGUE_PAR_DEFAUT, type Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { TEXTES_META_PARTAGE_PAR_LANGUE } from "~/contenus/meta-partage";

type InfosPage = {
  titre: string;
  description: string;
  langue?: Langue;
};

// Les réseaux sociaux demandent une adresse complète pour l'image d'aperçu
const ADRESSE_SITE = "https://sosmiam.fr";

/** Construit les balises meta d'une page (titre, description, aperçu pour les réseaux sociaux). */
export function creerMeta({ titre, description, langue = LANGUE_PAR_DEFAUT }: InfosPage) {
  const partage = choisirTextes(TEXTES_META_PARTAGE_PAR_LANGUE, langue);
  // Un titre qui commence déjà par la marque (celui de l'accueil) n'est pas suivi d'un second « SOS Miam »
  const titreComplet = titre.startsWith("SOS Miam") ? titre : `${titre} — SOS Miam`;
  return [
    { title: titreComplet },
    { name: "description", content: description },
    { property: "og:title", content: titreComplet },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:locale", content: partage.locale },
    { property: "og:site_name", content: "SOS Miam" },
    // Bannière grand public du kit de marque : la mascotte et « Sauve une table, régale-toi. »
    { property: "og:image", content: `${ADRESSE_SITE}/images/partage-reseaux.png` },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: partage.imageAlt },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: titreComplet },
    { name: "twitter:description", content: description },
  ];
}
