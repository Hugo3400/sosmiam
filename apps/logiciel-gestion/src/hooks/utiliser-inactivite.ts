import { useEffect, useRef } from "react";

const EVENEMENTS = ["pointerdown", "pointermove", "keydown", "wheel"] as const;

/** Appelle `quandInactif` après `minutes` sans souris ni clavier (verrouillage automatique du logiciel). */
export function utiliserInactivite(minutes: number, quandInactif: () => void, actif: boolean) {
  const rappel = useRef(quandInactif);
  rappel.current = quandInactif;
  useEffect(() => {
    if (!actif) return;
    let minuteur = setTimeout(() => rappel.current(), minutes * 60_000);
    const relancer = () => {
      clearTimeout(minuteur);
      minuteur = setTimeout(() => rappel.current(), minutes * 60_000);
    };
    for (const evenement of EVENEMENTS) window.addEventListener(evenement, relancer, { passive: true });
    return () => {
      clearTimeout(minuteur);
      for (const evenement of EVENEMENTS) window.removeEventListener(evenement, relancer);
    };
  }, [minutes, actif]);
}
