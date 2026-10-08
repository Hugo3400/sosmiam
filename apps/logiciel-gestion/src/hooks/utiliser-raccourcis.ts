import { useEffect, useRef } from "react";

import { ECRANS_RACCOURCIS } from "~/contenus/raccourcis.ts";
import type { Ecran } from "~/contenus/menu.ts";

type Actions = { rechercher: () => void; aller: (ecran: Ecran) => void; verrouiller: () => void; aide: () => void };

/**
 * Les raccourcis clavier (liste dans contenus/raccourcis.ts). Une touche déjà prise ailleurs (l'éditeur visuel garde
 * Ctrl+K pour les liens) n'est pas reprise ici.
 */
export function utiliserRaccourcis(actif: boolean, actions: Actions) {
  // Les actions changent à chaque rendu : on lit toujours les dernières, sans réabonner le clavier
  const dernieres = useRef(actions);
  dernieres.current = actions;

  useEffect(() => {
    if (!actif) return;
    const touche = (evenement: KeyboardEvent) => {
      if (evenement.defaultPrevented) return;
      const a = dernieres.current;
      const ctrl = evenement.ctrlKey || evenement.metaKey;
      const action =
        evenement.key === "F1" ? a.aide
        : !ctrl ? null
        : evenement.key.toLowerCase() === "k" ? a.rechercher
        : evenement.key.toLowerCase() === "l" ? a.verrouiller
        : evenement.key === "," ? () => a.aller("reglages")
        : /^[1-9]$/.test(evenement.key) && ECRANS_RACCOURCIS[Number(evenement.key) - 1] ? () => a.aller(ECRANS_RACCOURCIS[Number(evenement.key) - 1]!.ecran)
        : null;
      if (!action) return;
      evenement.preventDefault();
      action();
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [actif]);
}
