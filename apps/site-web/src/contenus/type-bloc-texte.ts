// Bloc de texte des contenus éditoriaux (FAQ, pages légales).
// Dans les textes : **gras** et [lien](/adresse), lus par decouperTexteRiche.

/** Un paragraphe, ou une liste (numérotée si `numerotee`). */
export type BlocTexte = string | { liste: string[]; numerotee?: boolean };
