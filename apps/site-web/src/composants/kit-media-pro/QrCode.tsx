import { encode } from "uqr";

import { couleursMarque as c } from "~/composants/marque/couleurs-marque";

type Props = {
  /** Adresse complète vers laquelle mène le QR code */
  lien: string;
  className?: string;
};

/**
 * QR code dessiné en SVG, calculé ici même (bibliothèque uqr, sans aucun service en ligne). Correction d'erreur « M »
 * (un QR un peu abîmé ou mal imprimé se lit encore) et la marge blanche de 4 modules qu'exigent les lecteurs.
 */
export function QrCode({ lien, className = "" }: Props) {
  const { size, data } = encode(lien, { ecc: "M", border: 4 });
  // Un seul chemin : un carré d'un module par case noire
  const cases = data.flatMap((ligne, y) => ligne.flatMap((noire, x) => (noire ? [`M${x} ${y}h1v1h-1z`] : [])));
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} shapeRendering="crispEdges" role="img" aria-label={`QR code vers ${lien}`}>
      <rect width={size} height={size} fill={c.blanc} />
      <path d={cases.join("")} fill={c.encre} />
    </svg>
  );
}
