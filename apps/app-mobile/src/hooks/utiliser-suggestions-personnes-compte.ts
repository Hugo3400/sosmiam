import { useEffect, useState } from "react";

import type { SuggestionPersonneApi } from "@sos-miam/commun/types/social";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserSession } from "~/hooks/utiliser-session";

/**
 * « Tu pourrais suivre », côté personnes, avec un compte connecté : GET /app/personnes/suggestions (10 au plus, déjà sans
 * toi, ce que tu suis, les bloqués et ce que tu as masqué), lu à l'ouverture de l'écran qui les montre ; la communauté
 * connaît ensuite ces personnes. null tant que ce n'est pas lu (ou hors compte, ou si la lecture a raté).
 */
export function utiliserSuggestionsPersonnesCompte(actif: boolean): SuggestionPersonneApi[] | null {
  const { sociaux } = utiliserSession();
  const { noterPersonne } = utiliserCommunaute();
  const [suggestions, setSuggestions] = useState<SuggestionPersonneApi[] | null>(null);

  useEffect(() => {
    if (!actif) return setSuggestions(null);
    let encore = true;
    void sociaux.social
      .suggerer()
      .catch(() => null)
      .then((r) => {
        if (!encore || !r?.ok) return;
        r.suggestions.forEach((s) => noterPersonne(s.personne));
        setSuggestions(r.suggestions);
      });
    return () => {
      encore = false;
    };
    // noterPersonne change à chaque relecture de la bande : la lecture ne repart pas pour autant
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actif, sociaux]);

  return suggestions;
}
