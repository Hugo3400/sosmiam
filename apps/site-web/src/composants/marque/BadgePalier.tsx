import type { ReactNode } from "react";

import { couleursMarque as c } from "~/composants/marque/couleurs-marque";

export type NiveauPalier = 1 | 2 | 3 | 4;

const ETOILE_VILLE = "0,-41 2.06,-35.83 7.61,-35.47 3.33,-31.92 4.7,-26.53 0,-29.5 -4.7,-26.53 -3.33,-31.92 -7.61,-35.47 -2.06,-35.83";
const fenetresVille = [[-6, -14], [2, -14], [-6, -4], [2, -4], [-6, 6], [2, 6], [-22, 2], [-22, 12], [18, 8], [18, 17]];
const trait = { fill: "none", stroke: c.encre, strokeWidth: 3.5, strokeLinecap: "round" } as const;

// Les quatre badges du kit ambassadeur, dessinés autour de (0, 0) : fond, puis dessin du palier
const badges: Record<NiveauPalier, { fond: string; pointilles: string; dessin: ReactNode }> = {
  // Curieux : deux grands yeux
  1: {
    fond: c.creme,
    pointilles: c.encre,
    dessin: (
      <>
        <circle cx="-17" cy="2" r="15" fill={c.blanc} stroke={c.encre} strokeWidth="3" />
        <circle cx="17" cy="2" r="15" fill={c.blanc} stroke={c.encre} strokeWidth="3" />
        <circle cx="-11" cy="6" r="7" fill={c.encre} />
        <circle cx="23" cy="6" r="7" fill={c.encre} />
        <circle cx="-9" cy="3" r="2.2" fill={c.blanc} />
        <circle cx="25" cy="3" r="2.2" fill={c.blanc} />
        <path d="M-31 -20q13 -9 27 -1" {...trait} />
        <path d="M4 -21q13 -9 27 1" {...trait} />
      </>
    ),
  },
  // Dénicheur : une loupe sur un cœur
  2: {
    fond: c.jauneClair,
    pointilles: c.encre,
    dessin: (
      <>
        <path d="M8 8L28 28" stroke={c.encre} strokeWidth="12" strokeLinecap="round" />
        <path d="M16 16L28 28" stroke={c.tomate} strokeWidth="6" strokeLinecap="round" />
        <circle cx="-6" cy="-6" r="21" fill={c.creme} stroke={c.encre} strokeWidth="4.5" />
        <path d="M-6 1C-17 -7 -12 -17 -6 -10C0 -17 5 -7 -6 1Z" fill={c.tomate} stroke={c.encre} strokeWidth="2" strokeLinejoin="round" />
      </>
    ),
  },
  // Ambassadeur de quartier : une boutique avec son store
  3: {
    fond: c.jaune,
    pointilles: c.encre,
    dessin: (
      <>
        <rect x="-26" y="-8" width="52" height="34" fill={c.creme} stroke={c.encre} strokeWidth="3" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={-30 + i * 12} y="-24" width="12" height="14" fill={i % 2 ? c.blanc : c.tomate} />
        ))}
        <rect x="-30" y="-24" width="60" height="14" fill="none" stroke={c.encre} strokeWidth="3" />
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M${-30 + i * 12} -10a6 6 0 0 0 12 0`} fill={i % 2 ? c.blanc : c.tomate} stroke={c.encre} strokeWidth="2.5" />
        ))}
        <rect x="-7" y="6" width="14" height="20" fill={c.tomate} stroke={c.encre} strokeWidth="2.5" />
        <rect x="-21" y="4" width="10" height="10" fill={c.blanc} stroke={c.encre} strokeWidth="2" />
        <rect x="11" y="4" width="10" height="10" fill={c.blanc} stroke={c.encre} strokeWidth="2" />
      </>
    ),
  },
  // Ambassadeur de ville : des immeubles et une étoile
  4: {
    fond: c.encre,
    pointilles: c.jaune,
    dessin: (
      <>
        <rect x="-28" y="-4" width="16" height="30" fill={c.jaune} />
        <rect x="-10" y="-20" width="20" height="46" fill={c.jaune} />
        <rect x="12" y="2" width="16" height="24" fill={c.jaune} />
        {fenetresVille.map(([x, y]) => <rect key={`${x} ${y}`} x={x} y={y} width="4" height="5" fill={c.encre} />)}
        <rect x="-34" y="26" width="68" height="3" fill={c.jaune} />
        <polygon points={ETOILE_VILLE} fill={c.tomate} />
      </>
    ),
  },
};

/** Badge d'un palier ambassadeur (kit de marque), avec sa pastille de niveau. Décoratif. */
export function BadgePalier({ niveau, className = "" }: { niveau: NiveauPalier; className?: string }) {
  const badge = badges[niveau];
  return (
    <svg viewBox="-60 -60 120 120" className={className} aria-hidden="true">
      <circle r="58" fill={badge.fond} stroke={c.encre} strokeWidth="3" />
      <circle r="49" fill="none" stroke={badge.pointilles} strokeWidth="1.5" strokeDasharray="4 4" />
      {badge.dessin}
      <circle cx="42" cy="-42" r="13" fill={c.tomate} stroke={c.encre} strokeWidth="2.5" />
      <text x="42" y="-37.5" textAnchor="middle" fontSize="13" fontWeight="800" fill={c.blanc}>{niveau}</text>
    </svg>
  );
}
