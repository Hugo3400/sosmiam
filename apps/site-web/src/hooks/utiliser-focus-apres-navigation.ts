import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

import type { EtatAncre } from "~/hooks/utiliser-ancres-sans-diese";

/**
 * Après un changement de page sans rechargement, donne le focus au titre principal : les lecteurs d'écran
 * annoncent la nouvelle page. Rien au premier affichage, ni quand une ancre est demandée (defilerVersElement s'en charge).
 */
export function utiliserFocusApresNavigation() {
  const location = useLocation();
  const premierAffichage = useRef(true);

  useEffect(() => {
    if (premierAffichage.current) {
      premierAffichage.current = false;
      return;
    }
    if ((location.state as EtatAncre | null)?.ancre) return;
    const cible = document.querySelector<HTMLElement>("main h1") ?? document.querySelector<HTMLElement>("main");
    if (!cible) return;
    if (!cible.hasAttribute("tabindex")) cible.setAttribute("tabindex", "-1");
    cible.focus({ preventScroll: true });
  }, [location.pathname]);
}
