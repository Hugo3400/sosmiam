import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/** Vrai quand un lecteur d'écran (VoiceOver, TalkBack) tourne ; suit les changements pendant que l'app est ouverte. */
export function utiliserLecteurEcran(): boolean {
  const [lecteurEcran, setLecteurEcran] = useState(false);
  useEffect(() => {
    let abonne = true;
    AccessibilityInfo.isScreenReaderEnabled()
      .then((actif) => {
        if (abonne) setLecteurEcran(actif);
      })
      .catch(() => {});
    const abonnement = AccessibilityInfo.addEventListener("screenReaderChanged", setLecteurEcran);
    return () => {
      abonne = false;
      abonnement.remove();
    };
  }, []);
  return lecteurEcran;
}
