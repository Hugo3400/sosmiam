/** Une étape du fil d'Ariane : son nom et son adresse complète */
export type EtapeFilAriane = { nom: string; adresse: string };

/** Données structurées « BreadcrumbList » (schema.org) : où se trouve la page dans le site (Accueil › Nom du lieu). */
export function creerDonneesFilAriane(etapes: EtapeFilAriane[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: etapes.map((etape, rang) => ({ "@type": "ListItem", position: rang + 1, name: etape.nom, item: etape.adresse })),
  };
}
