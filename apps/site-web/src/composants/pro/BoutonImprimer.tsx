import { useEffect, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/**
 * « Imprimer » : ouvre l'impression du navigateur. Le bouton n'apparaît qu'une fois la page prête (il a besoin de
 * JavaScript) ; avant, et sans JavaScript, une phrase dit d'utiliser « Imprimer » du navigateur.
 */
export function BoutonImprimer() {
  const [pret, setPret] = useState(false);
  useEffect(() => setPret(true), []);
  if (!pret) return <p className="font-semibold">{lierPonctuation("Pour l'imprimer : menu « Imprimer » de ton navigateur (Ctrl + P, ou ⌘ + P sur Mac).")}</p>;
  return <Bouton onClick={() => window.print()}>Imprimer l'affichette</Bouton>;
}
