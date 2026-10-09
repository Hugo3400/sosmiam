import type { ReactNode } from "react";

import { couleursMarque as c } from "~/composants/marque/couleurs-marque";
import { formatsImpression } from "~/contenus/kit-media-pro";

const { largeur, hauteur } = formatsImpression.A4;
const flyer = formatsImpression.A6;

/** Les flyers sont un peu réduits : une imprimante de bureau n'imprime pas jusqu'au bord de la feuille */
const REDUCTION = 0.92;
const LONGUEUR_TRAIT = 90;
const ECART_TRAIT = 24;

/**
 * Quatre flyers A6 côte à côte sur une feuille A4 (300 dpi : 2480 × 3508 px), centrés, avec des traits de coupe
 * autour : 6 coups de ciseaux ou de massicot. Le même dessin quatre fois, donc rectos et versos tombent bien en face
 * l'un de l'autre à l'impression recto verso.
 */
export function PlancheFlyersA4({ children }: { children: ReactNode }) {
  const bloc = { largeur: flyer.largeur * 2 * REDUCTION, hauteur: flyer.hauteur * 2 * REDUCTION };
  const gauche = (largeur - bloc.largeur) / 2;
  const haut = (hauteur - bloc.hauteur) / 2;
  const colonnes = [gauche, gauche + bloc.largeur / 2, gauche + bloc.largeur];
  const lignes = [haut, haut + bloc.hauteur / 2, haut + bloc.hauteur];
  return (
    <div className="relative bg-white" style={{ width: largeur, height: hauteur }}>
      <div className="absolute" style={{ left: gauche, top: haut }}>
        <div className="grid grid-cols-2" style={{ zoom: REDUCTION }}>
          {[0, 1, 2, 3].map((n) => <div key={n}>{children}</div>)}
        </div>
      </div>
      <svg className="absolute inset-0" width={largeur} height={hauteur} aria-hidden="true">
        <g stroke={c.encre} strokeWidth="3">
          {colonnes.map((x) => (
            <g key={`c${x}`}>
              <line x1={x} x2={x} y1={haut - ECART_TRAIT - LONGUEUR_TRAIT} y2={haut - ECART_TRAIT} />
              <line x1={x} x2={x} y1={haut + bloc.hauteur + ECART_TRAIT} y2={haut + bloc.hauteur + ECART_TRAIT + LONGUEUR_TRAIT} />
            </g>
          ))}
          {lignes.map((y) => (
            <g key={`l${y}`}>
              <line y1={y} y2={y} x1={gauche - ECART_TRAIT - LONGUEUR_TRAIT} x2={gauche - ECART_TRAIT} />
              <line y1={y} y2={y} x1={gauche + bloc.largeur + ECART_TRAIT} x2={gauche + bloc.largeur + ECART_TRAIT + LONGUEUR_TRAIT} />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
