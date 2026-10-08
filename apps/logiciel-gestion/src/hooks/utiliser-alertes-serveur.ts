import { useCallback, useEffect, useRef, useState } from "react";

import { trouverProblemes } from "~/fonctions/maintenance/trouver-problemes.ts";
import { lireEtatServeur, type EtatServeur } from "~/services/maintenance.ts";
import { notifier } from "~/services/systeme.ts";

/**
 * Surveille le serveur chaque minute ; chaque nouveau problème déclenche une notification Windows.
 * `prendreEtat` met les alertes à jour tout de suite avec un état déjà lu (écran Maintenance), `verifier` relit le serveur.
 */
export function utiliserAlertesServeur(actif: boolean) {
  const [problemes, setProblemes] = useState<string[]>([]);
  const dejaSignales = useRef(new Set<string>());

  const prendreEtat = useCallback((etat: EtatServeur) => {
    const trouves = trouverProblemes(etat);
    setProblemes(trouves);
    for (const probleme of trouves) if (!dejaSignales.current.has(probleme)) void notifier("⚠️ Serveur SOS Miam", probleme);
    dejaSignales.current = new Set(trouves);
  }, []);

  const verifier = useCallback(async () => {
    try {
      prendreEtat(await lireEtatServeur());
    } catch {
      // Session perdue ou serveur injoignable : le reste du logiciel le dit déjà
    }
  }, [prendreEtat]);

  useEffect(() => {
    if (!actif) return;
    void verifier();
    const minuteur = setInterval(verifier, 60_000);
    return () => clearInterval(minuteur);
  }, [actif, verifier]);

  return { problemes, prendreEtat, verifier };
}
