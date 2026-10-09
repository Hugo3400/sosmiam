import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useEffect } from "react";

import { utiliserComptoir, type EtatUtiliserComptoir } from "~/hooks/utiliser-comptoir";

const ETIQUETTE_EVEIL = "qr-comptoir";
// Un petit temps après le changement de fenêtre, pour être sûr de lire le nouveau QR
const MARGE_CHANGEMENT_MS = 250;

/**
 * Le comptoir, pendant que le QR est montré en grand : l'écran reste allumé (le téléphone ne se met pas en veille sous le
 * nez du client) et le QR est relu pile à chaque changement de fenêtre (toutes les 30 s), en plus des relectures du comptoir.
 */
export function utiliserQrTournant(lieuId: number | null): EtatUtiliserComptoir {
  const comptoir = utiliserComptoir(lieuId);
  const { etat, rafraichir } = comptoir;

  // Écran allumé tant que le QR est affiché (sur le web, le navigateur peut refuser : sans gravité)
  useEffect(() => {
    activateKeepAwakeAsync(ETIQUETTE_EVEIL).catch(() => {});
    return () => {
      try {
        deactivateKeepAwake(ETIQUETTE_EVEIL);
      } catch {
        // Rien à éteindre
      }
    };
  }, []);

  const changeDansMs = etat?.qr?.changeDansMs ?? null;
  const fenetre = etat?.qr?.fenetre ?? null;
  useEffect(() => {
    if (changeDansMs === null) return;
    const minuterie = setTimeout(rafraichir, changeDansMs + MARGE_CHANGEMENT_MS);
    return () => clearTimeout(minuterie);
  }, [fenetre, changeDansMs, rafraichir]);

  return comptoir;
}
