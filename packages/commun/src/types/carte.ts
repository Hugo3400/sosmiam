// La carte d'un lieu : plats et boissons d'un resto, d'un bar ou d'une pâtisserie, formules et tarifs d'une activité.

/** Repères affichés à côté d'un élément de la carte */
export type EtiquetteCarte = "vege" | "vegan" | "sans-gluten" | "epice" | "fait-maison" | "local";

/** Un plat, une boisson, une formule… */
export type ElementCarte = {
  nom: string;
  description?: string;
  /** Prix en euros (12, 4.5) */
  prix: number;
  /** Ce que couvre le prix, quand ce n'est pas évident : « le verre », « par personne », « la partie de 1 h » */
  unite?: string;
  /** Spécialité de la maison, mise en avant */
  signature?: boolean;
  /** Contient de l'alcool : masqué aux moins de 18 ans, comme partout dans l'app */
  alcool?: boolean;
  etiquettes?: EtiquetteCarte[];
};

export type SectionCarte = { titre: string; elements: ElementCarte[] };

export type CarteLieu = {
  sections: SectionCarte[];
  /** Date de la dernière mise à jour par le lieu (AAAA-MM-JJ) */
  majLe?: string;
};
