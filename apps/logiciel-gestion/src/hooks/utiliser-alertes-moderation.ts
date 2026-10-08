import { useEffect, useRef, useState } from "react";

import { notifier } from "~/services/systeme.ts";
import { lireTableauDeBord } from "~/services/tableau-de-bord.ts";

/**
 * Surveille la file de modération chaque minute (décision du 8 octobre 2026 : l'alerte arrive dans le logiciel).
 * Un nouveau signalement grave (publication masquée pour tous) déclenche une notification Windows.
 */
export function utiliserAlertesModeration(actif: boolean) {
  const [compteurs, setCompteurs] = useState({ aTraiter: 0, urgents: 0, demandes: 0 });
  const urgentsConnus = useRef<number | null>(null);

  useEffect(() => {
    if (!actif) return;
    let annule = false;
    const verifier = async () => {
      try {
        const { moderation, demandes } = await lireTableauDeBord();
        if (annule) return;
        setCompteurs({ ...moderation, demandes: demandes.aTraiter });
        if (urgentsConnus.current !== null && moderation.urgents > urgentsConnus.current) {
          void notifier("🚨 Publication masquée pour tous", "Un signalement grave attend ta décision dans la modération.");
        }
        urgentsConnus.current = moderation.urgents;
      } catch {
        // Session perdue ou serveur injoignable : on réessaie à la prochaine minute
      }
    };
    void verifier();
    const minuteur = setInterval(verifier, 60_000);
    return () => {
      annule = true;
      clearInterval(minuteur);
    };
  }, [actif]);

  return compteurs;
}
