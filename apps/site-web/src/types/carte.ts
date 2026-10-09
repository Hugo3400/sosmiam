// La carte d'un lieu (« Ma carte » de l'espace pro, fiche publique). La forme enregistrée, ses limites et sa vérification
// viennent de packages/commun (types/carte.ts, regles/carte-du-lieu.ts, validation/valider-carte-du-lieu.ts), importés
// tels quels : jamais recopiés. Ici, seulement le brouillon du formulaire.
export type { CarteLieu, ElementCarte, EtiquetteCarte, SectionCarte } from "../../../../packages/commun/src/types/carte.ts";

/** Un plat tel qu'il est tapé dans le formulaire : du texte (le prix aussi, « 12,50 »), pas encore vérifié */
export type BrouillonElement = {
  nom: string;
  description: string;
  prix: string;
  unite: string;
  signature: boolean;
  alcool: boolean;
  etiquettes: string[];
};

export type BrouillonSection = { titre: string; elements: BrouillonElement[] };

/** La carte en cours de saisie : ce que renvoie chaque bouton de l'éditeur, avant « Enregistrer ma carte » */
export type BrouillonCarte = { sections: BrouillonSection[] };

/** Où mettre le focus après un geste : un champ (par son nom) ou un bouton (par son id) */
export type FocusCarte = { champ: string } | { bouton: string } | null;
