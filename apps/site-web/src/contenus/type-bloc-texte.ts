// Bloc de texte des contenus éditoriaux (FAQ, pages légales).
// Dans les textes : **gras** et [lien](/adresse), lus par decouperTexteRiche.

/** Un tableau : une ligne par élément, une case par colonne (sur téléphone, chaque ligne devient une petite fiche). */
export type TableauTexte = {
  /** Phrase qui dit ce que montre le tableau (lue par les lecteurs d'écran) */
  legende: string;
  colonnes: string[];
  lignes: string[][];
};

/** Un paragraphe, une liste (numérotée si `numerotee`) ou un tableau. */
export type BlocTexte = string | { liste: string[]; numerotee?: boolean } | { tableau: TableauTexte };
