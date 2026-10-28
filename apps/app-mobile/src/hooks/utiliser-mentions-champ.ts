import { useEffect, useMemo, useRef, useState } from "react";

import type { Pote } from "@sos-miam/commun/types/potes";
import { TEXTES_MENTIONS_CHAMP_PAR_LANGUE } from "~/contenus/textes-mentions-champ";
import { insererMention } from "~/fonctions/chat/inserer-mention";
import { trouverMentionEnCours } from "~/fonctions/chat/trouver-mention-en-cours";
import { annoncerLecteurEcran } from "~/fonctions/interaction/annoncer-lecteur-ecran";
import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";
import { utiliserTextes } from "~/hooks/utiliser-textes";

const MAX_SUGGESTIONS = 4;

type Selection = { start: number; end: number };

export function utiliserMentionsChamp(texte: string, membres: readonly Pote[], onChanger: (texte: string) => void) {
  const T = utiliserTextes(TEXTES_MENTIONS_CHAMP_PAR_LANGUE);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [texteVu, setTexteVu] = useState(texte);
  if (texte !== texteVu) {
    setTexteVu(texte);
    if (selection && selection.end >= texteVu.length) setSelection(null);
  }
  const curseur = Math.min(selection?.end ?? texte.length, texte.length);
  const enCours = membres.length > 0 ? trouverMentionEnCours(texte, curseur) : null;
  const recherche = enCours ? normaliserRecherche(enCours.recherche) : null;
  const suggestions = useMemo(
    () =>
      recherche === null
        ? []
        : membres.filter((p) => p.pseudo && (p.pseudo.startsWith(recherche) || normaliserRecherche(p.prenom).startsWith(recherche))).slice(0, MAX_SUGGESTIONS),
    [membres, recherche],
  );

  const avaitSuggestions = useRef(false);
  useEffect(() => {
    const nombre = suggestions.length;
    if (nombre > 0 && !avaitSuggestions.current) annoncerLecteurEcran(T.suggestions(nombre));
    avaitSuggestions.current = nombre > 0;
  }, [suggestions.length, T]);

  return {
    suggestions,
    suivreSelection: (evenement: { nativeEvent: { selection: Selection } }) => setSelection(evenement.nativeEvent.selection),
    mentionner: (pote: Pote) => {
      if (!enCours) return;
      const insere = insererMention(texte, enCours.debut, curseur, pote.pseudo);
      onChanger(insere.texte);
      setSelection({ start: insere.curseur, end: insere.curseur });
    },
    oublierSelection: () => setSelection(null),
  };
}
