import { useCallback, useEffect, useRef, useState } from "react";

import { notifier } from "~/services/systeme.ts";
import { lireTableauDeBord } from "~/services/tableau-de-bord.ts";

/**
 * Surveille la file de modération, les demandes de lieux et les ambassadeurs à valider chaque minute (décision du
 * 8 octobre 2026 : l'alerte arrive dans le logiciel). Un nouveau signalement grave (publication masquée pour tous) ou une
 * nouvelle inscription d'ambassadeur déclenche une notification Windows.
 */
export function utiliserAlertesModeration(actif: boolean) {
  const [compteurs, setCompteurs] = useState({ aTraiter: 0, urgents: 0, demandes: 0, ambassadeurs: 0 });
  const urgentsConnus = useRef<number | null>(null);
  const ambassadeursConnus = useRef<number | null>(null);
  const verifierMaintenant = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (!actif) return;
    let annule = false;
    const verifier = async () => {
      try {
        const { moderation, demandes, ambassadeurs } = await lireTableauDeBord();
        if (annule) return;
        // Serveur pas encore à jour (sans le bloc ambassadeurs) : zéro, sans casser les autres compteurs
        const enAttente = ambassadeurs?.enAttente ?? 0;
        setCompteurs({ ...moderation, demandes: demandes.aTraiter, ambassadeurs: enAttente + (ambassadeurs?.candidatures ?? 0) });
        if (urgentsConnus.current !== null && moderation.urgents > urgentsConnus.current) {
          void notifier("🚨 Publication masquée pour tous", "Un signalement grave attend ta décision dans la modération.");
        }
        if (ambassadeursConnus.current !== null && enAttente > ambassadeursConnus.current) {
          void notifier("🙋 Nouvel ambassadeur", "Une inscription à l'espace ambassadeur attend ta validation.");
        }
        urgentsConnus.current = moderation.urgents;
        ambassadeursConnus.current = enAttente;
      } catch {
        // Session perdue ou serveur injoignable : on réessaie à la prochaine minute
      }
    };
    verifierMaintenant.current = verifier;
    void verifier();
    const minuteur = setInterval(verifier, 60_000);
    return () => {
      annule = true;
      verifierMaintenant.current = null;
      clearInterval(minuteur);
    };
  }, [actif]);

  /** Relit les compteurs tout de suite (après une décision prise dans un écran) */
  const actualiser = useCallback(() => void verifierMaintenant.current?.(), []);
  return { ...compteurs, actualiser };
}
