// Bloc de texte des contenus éditoriaux (FAQ, pages légales).
// Dans les textes : **gras** et [lien](/adresse), lus par decouperTexteRiche.

/** Un tableau : une ligne par élément, une case par colonne (sur téléphone, chaque ligne devient une petite fiche). */
export type TableauTexte = {
  /** Phrase qui dit ce que montre le tableau (lue par les lecteurs d'écran) */
  legende: string;
  colonnes: readonly string[];
  lignes: readonly (readonly string[])[];
};

/** Un paragraphe, une liste (numérotée si `numerotee`) ou un tableau. */
export type BlocTexte = string | { readonly liste: readonly string[]; readonly numerotee?: boolean } | { readonly tableau: TableauTexte };
