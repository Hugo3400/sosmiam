import type { ReactNode } from "react";

import { couleursMarque as c } from "~/composants/marque/couleurs-marque";
import type { TypeLieu } from "~/contenus/lieux-exemples";

const ETOILE_TICKET = "-4.5,-5 -3.21,-1.78 0.26,-1.55 -2.41,0.68 -1.56,4.05 -4.5,2.2 -7.44,4.05 -6.59,0.68 -9.26,-1.55 -5.79,-1.78";

// Pictos du kit de marque, dessinés autour de (0, 0) dans un carré d'environ 32 de côté
const dessins: Record<TypeLieu, ReactNode> = {
  resto: (
    <g fill={c.encre}>
      <rect x="-12" y="-16" width="2.5" height="12" rx="1.2" />
      <rect x="-8.2" y="-16" width="2.5" height="12" rx="1.2" />
      <rect x="-4.5" y="-16" width="2.5" height="12" rx="1.2" />
      <rect x="-12" y="-6" width="10" height="5" rx="2.5" />
      <rect x="-8.5" y="-4" width="3" height="20" rx="1.5" />
      <path d="M4 -16Q12 -13 11 3H7.5V16H4.5Z" />
    </g>
  ),
  patisserie: (
    <g stroke={c.encre} strokeWidth="2" strokeLinejoin="round">
      <path d="M-10 2H10L7 16H-7Z" fill={c.tomate} />
      <path d="M-12 2Q-14 -6 -6 -7Q-4 -14 4 -11Q12 -11 11 -4Q14 -1 12 2Z" fill={c.blanc} />
      <circle cx="1" cy="-14" r="3.5" fill={c.tomate} />
    </g>
  ),
  bar: (
    <g>
      <path d="M-13 -12H13L1.5 1V12H7V16H-7V12H-1.5V1Z" fill={c.encre} />
      <path d="M-8 -7H8L0 0.5Z" fill={c.tomate} />
      <path d="M6 -12L12 -18" stroke={c.encre} strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  sortie: (
    <g>
      <path d="M-15 -9H15V-3A3 3 0 0 0 15 3V9H-15V3A3 3 0 0 0 -15 -3Z" fill={c.tomate} stroke={c.encre} strokeWidth="2" strokeLinejoin="round" />
      <path d="M6 -7V7" stroke={c.encre} strokeWidth="1.5" strokeDasharray="2 2" />
      <polygon points={ETOILE_TICKET} fill={c.blanc} />
    </g>
  ),
};

/** Picto d'une catégorie de lieu (resto, pâtisserie, bar, sortie) sur sa pastille jaune. Décoratif. */
export function PictoCategorie({ type, className = "" }: { type: TypeLieu; className?: string }) {
  return (
    <svg viewBox="-36 -36 72 72" className={className} aria-hidden="true">
      <circle r="34" fill={c.jaune} stroke={c.encre} strokeWidth="3" />
      <g transform="scale(1.4)">{dessins[type]}</g>
    </svg>
  );
}
