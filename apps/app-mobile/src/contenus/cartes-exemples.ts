import type { CarteLieu } from "@sos-miam/commun/types/carte";

/**
 * Cartes des lieux d'exemple (identifiant du lieu → sa carte), en attendant que les lieux la remplissent eux-mêmes via l'API.
 * Le plat signature de chaque lieu (lieux-exemples.ts, champ « plat ») y figure avec le même prix.
 */
export const cartesExemples: Partial<Record<number, CarteLieu>> = {
  0: {
    sections: [
      {
        titre: "Les pâtes fraîches",
        elements: [
          { nom: "Cacio e pepe", description: "Tonnarelli, pecorino romano et poivre noir concassé", prix: 12, signature: true, etiquettes: ["vege", "fait-maison"] },
          { nom: "Lasagnes de Nonna", description: "Ragù mijoté 6 heures, béchamel, parmesan", prix: 14, etiquettes: ["fait-maison"] },
        ],
      },
      { titre: "Pour commencer", elements: [{ nom: "Burrata", description: "Tomates du marché, basilic, huile d'olive", prix: 9, etiquettes: ["vege"] }] },
      { titre: "Desserts", elements: [{ nom: "Tiramisu", description: "Mascarpone, café serré, cacao", prix: 6, etiquettes: ["vege", "fait-maison"] }] },
      { titre: "À boire", elements: [{ nom: "Spritz maison", prix: 7, unite: "le verre", alcool: true }] },
    ],
  },
};
