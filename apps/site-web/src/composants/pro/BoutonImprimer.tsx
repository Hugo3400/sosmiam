import { useEffect, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_IMPRIMES_PRO_PAR_LANGUE } from "~/contenus/imprimes-pro";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * « Imprimer » : ouvre l'impression du navigateur. Le bouton n'apparaît qu'une fois la page prête (il a besoin de
 * JavaScript) ; avant, et sans JavaScript, une phrase dit d'utiliser « Imprimer » du navigateur.
 */
export function BoutonImprimer({ libelle }: { libelle?: string }) {
  const T = utiliserTextes(TEXTES_IMPRIMES_PRO_PAR_LANGUE).imprimer;
  const [pret, setPret] = useState(false);
  useEffect(() => setPret(true), []);
  if (!pret) return <p className="font-semibold">{lierPonctuation(T.sansJavascript)}</p>;
  return <Bouton onClick={() => window.print()}>{libelle ?? T.affichette}</Bouton>;
}
