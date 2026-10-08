import { useEffect, useRef, useState } from "react";

import { trouverProblemes } from "~/fonctions/maintenance/trouver-problemes.ts";
import { lireEtatServeur } from "~/services/maintenance.ts";
import { notifier } from "~/services/systeme.ts";

/** Surveille le serveur toutes les 5 minutes ; chaque nouveau problème déclenche une notification Windows. */
export function utiliserAlertesServeur(actif: boolean) {
  const [problemes, setProblemes] = useState<string[]>([]);
  const dejaSignales = useRef(new Set<string>());

  useEffect(() => {
    if (!actif) return;
    let annule = false;
    const verifier = async () => {
      try {
        const trouves = trouverProblemes(await lireEtatServeur());
        if (annule) return;
        setProblemes(trouves);
        for (const probleme of trouves) {
          if (!dejaSignales.current.has(probleme)) void notifier("⚠️ Serveur SOS Miam", probleme);
        }
        dejaSignales.current = new Set(trouves);
      } catch {
        // Session perdue ou serveur injoignable : le reste du logiciel le dit déjà
      }
    };
    void verifier();
    const minuteur = setInterval(verifier, 5 * 60_000);
    return () => {
      annule = true;
      clearInterval(minuteur);
    };
  }, [actif]);

  return problemes;
}
