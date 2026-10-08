import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

/**
 * Compte les retours de l'app au premier plan (après le verrouillage, une autre app, un appel, Siri…). Un nouveau numéro
 * à chaque retour : un effet qui en dépend se rejoue, par exemple pour relancer une vidéo que le téléphone a mise en pause.
 */
export function utiliserRetoursPremierPlan(): number {
  const [retours, setRetours] = useState(0);
  const etat = useRef(AppState.currentState);
  useEffect(() => {
    const abonnement = AppState.addEventListener("change", (suivant) => {
      if (suivant === "active" && etat.current !== "active") setRetours((n) => n + 1);
      etat.current = suivant;
    });
    return () => abonnement.remove();
  }, []);
  return retours;
}
