import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { poserFeuilleOuverte } from "~/services/feuilles-ouvertes";

// La page s'ouvre une fois la feuille redescendue : plus tôt, elle passerait dessous (et VoiceOver, qui revient sur le bouton
// qui avait ouvert la feuille, la quitterait aussitôt). Un peu plus sur iPhone, où la fenêtre de la feuille part en dernier
const DUREE_FERMETURE = Platform.OS === "ios" ? 700 : 450;

/**
 * Inscrit une feuille (Modal) parmi les feuilles ouvertes tant qu'elle est visible (services/feuilles-ouvertes) : l'annonce
 * d'un compte limité, posée au-dessus de tout, peut alors la refermer avant d'ouvrir « Voir pourquoi », et l'attendre sur
 * Android, où la feuille la recouvre. `onFermer` : ce que fait déjà la feuille pour se refermer sans rien changer.
 */
export function utiliserInscriptionFeuille(visible: boolean, onFermer: () => void): void {
  const fermer = useRef(onFermer);
  useEffect(() => {
    fermer.current = onFermer;
  });

  useEffect(() => {
    if (!visible) return;
    return poserFeuilleOuverte(
      (destination) => {
        fermer.current();
        // Le routeur de l'app, pas celui du composant : la feuille a pu disparaître de l'écran entre-temps
        setTimeout(() => router.push(destination), DUREE_FERMETURE);
      },
      () => fermer.current(),
    );
  }, [visible]);
}
