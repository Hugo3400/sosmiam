import type { BrouillonCarte, BrouillonElement, CarteLieu } from "../../types/carte.ts";

/** Un plat vide, prêt à remplir */
export const PLAT_VIDE: BrouillonElement = { nom: "", description: "", prix: "", unite: "", signature: false, alcool: false, etiquettes: [] };

/** La carte enregistrée, mise dans les champs de l'éditeur (prix à la française : « 12 », « 4,50 ») ; null : carte vide. */
export function creerBrouillonCarte(carte: CarteLieu | null): BrouillonCarte {
  return {
    sections: (carte?.sections ?? []).map((section) => ({
      titre: section.titre,
      elements: section.elements.map((element) => ({
        nom: element.nom,
        description: element.description ?? "",
        prix: Number.isInteger(element.prix) ? String(element.prix) : element.prix.toFixed(2).replace(".", ","),
        unite: element.unite ?? "",
        signature: element.signature === true,
        alcool: element.alcool === true,
        etiquettes: [...(element.etiquettes ?? [])],
      })),
    })),
  };
}
