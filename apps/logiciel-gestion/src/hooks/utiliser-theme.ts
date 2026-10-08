import { useEffect, useState } from "react";

import { ecrireTheme, lireTheme, type ChoixTheme } from "~/stockage/reglages-poste.ts";

/**
 * Le thème du logiciel (Réglages → Apparence) : clair, sombre, ou comme Windows (et il suit Windows en direct quand on
 * change). Posé sur <html data-theme>, que la feuille de style lit.
 */
export function utiliserTheme() {
  const [choix, setChoix] = useState<ChoixTheme>(lireTheme);
  useEffect(() => {
    const sombreWindows = window.matchMedia("(prefers-color-scheme: dark)");
    const appliquer = () => {
      const sombre = choix === "sombre" || (choix === "auto" && sombreWindows.matches);
      document.documentElement.dataset.theme = sombre ? "sombre" : "clair";
    };
    appliquer();
    sombreWindows.addEventListener("change", appliquer);
    return () => sombreWindows.removeEventListener("change", appliquer);
  }, [choix]);
  const changer = (theme: ChoixTheme) => {
    ecrireTheme(theme);
    setChoix(theme);
  };
  return { theme: choix, changerTheme: changer };
}
