import type { ReactNode } from "react";
import { Circle, Ellipse, G, Path } from "react-native-svg";

import { couleursMarque as c } from "~/composants/marque/couleurs-marque";
import type { ExpressionMascotte } from "~/composants/marque/Mascotte";

// Géométrie du kit de marque (identique au site), dans un carré de 200 × 200 centré sur (100, 100)
const SECTEURS = "M172.93 145.57A86 86 0 0 1 145.57 172.93L122.26 135.62A42 42 0 0 0 135.62 122.26ZM54.43 172.93A86 86 0 0 1 27.07 145.57L64.38 122.26A42 42 0 0 0 77.74 135.62ZM27.07 54.43A86 86 0 0 1 54.43 27.07L77.74 64.38A42 42 0 0 0 64.38 77.74ZM145.57 27.07A86 86 0 0 1 172.93 54.43L135.62 77.74A42 42 0 0 0 122.26 64.38Z";
const OMBRE = "M171.48 119.15A74 74 0 0 1 28.52 119.15";
const REFLET = "M36.1 123.26A68 68 0 0 1 36.1 76.74";
const CORDE = "M166.32 55.26Q218 100 166.32 144.74M144.74 166.32Q100 218 55.26 166.32M33.68 144.74Q-18 100 33.68 55.26M55.26 33.68Q100 -18 144.74 33.68";

const trait = { fill: "none", stroke: c.encre, strokeWidth: 3.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const joues = (
  <>
    <Ellipse cx="76" cy="106" rx="6" ry="3.5" fill={c.tomate} fillOpacity={0.45} />
    <Ellipse cx="124" cy="106" rx="6" ry="3.5" fill={c.tomate} fillOpacity={0.45} />
  </>
);

const visages: Record<ExpressionMascotte, ReactNode> = {
  // Yeux brillants et grande bouche gourmande
  miam: (
    <>
      <Ellipse cx="87" cy="94" rx="4.5" ry="6" fill={c.encre} />
      <Ellipse cx="113" cy="94" rx="4.5" ry="6" fill={c.encre} />
      <Circle cx="88.6" cy="91.6" r="1.6" fill={c.blanc} />
      <Circle cx="114.6" cy="91.6" r="1.6" fill={c.blanc} />
      {joues}
      <Path d="M88 105H112Q112 121 100 121Q88 121 88 105Z" fill={c.encre} />
      <Path d="M93 117Q100 110 107 117Q100 121.5 93 117Z" fill={c.tomate} />
    </>
  ),
  // Clin d'œil et langue tirée
  clin: (
    <>
      <Path d="M81 96L87 90L93 96" {...trait} />
      <Ellipse cx="113" cy="94" rx="4.5" ry="6" fill={c.encre} />
      <Circle cx="114.6" cy="91.6" r="1.6" fill={c.blanc} />
      {joues}
      <Ellipse cx="106" cy="113" rx="4.5" ry="5.5" fill={c.tomate} stroke={c.encre} strokeWidth="2" />
      <Path d="M88 105Q100 117 112 105" {...trait} strokeWidth={4} />
    </>
  ),
  // Yeux ronds et bouche en O
  surprise: (
    <>
      <Path d="M79 81q8 -6 16 -2" {...trait} strokeWidth={3} />
      <Path d="M105 79q8 -4 16 2" {...trait} strokeWidth={3} />
      <Circle cx="87" cy="94" r="7.5" fill={c.blanc} stroke={c.encre} strokeWidth="2.5" />
      <Circle cx="113" cy="94" r="7.5" fill={c.blanc} stroke={c.encre} strokeWidth="2.5" />
      <Circle cx="87" cy="95" r="3.2" fill={c.encre} />
      <Circle cx="113" cy="95" r="3.2" fill={c.encre} />
      {joues}
      <Ellipse cx="100" cy="112" rx="6.5" ry="7.5" fill={c.encre} />
      <Ellipse cx="100" cy="116" rx="4" ry="3" fill={c.tomate} />
    </>
  ),
};

type Props = {
  /** Coin haut gauche et côté du carré de 200 dans lequel la bouée est dessinée */
  x?: number;
  y?: number;
  taille?: number;
  expression?: ExpressionMascotte;
  /** Corde tout autour : réservée à la mascotte */
  corde?: boolean;
};

/** La bouée qui sourit (dessin du kit de marque), à placer dans un <Svg>. */
export function Bouee({ x = 0, y = 0, taille = 200, expression = "miam", corde = false }: Props) {
  return (
    <G transform={`translate(${x} ${y}) scale(${taille / 200})`}>
      {corde ? (
        <G fill="none" strokeLinecap="round">
          <Path d={CORDE} stroke={c.encre} strokeWidth="8" />
          <Path d={CORDE} stroke={c.creme} strokeWidth="4.5" />
          <Path d={CORDE} stroke={c.encre} strokeWidth="4.5" strokeDasharray="1.5 4.5" strokeOpacity={0.5} />
        </G>
      ) : null}
      <Circle cx="100" cy="100" r="62" fill="none" stroke={c.jaune} strokeWidth="40" />
      <Path d={OMBRE} fill="none" stroke={c.jauneOmbre} strokeWidth="12" />
      <Circle cx="100" cy="100" r="40.5" fill={c.creme} />
      <Circle cx="100" cy="100" r="82" fill="none" stroke={c.encre} strokeWidth="3.5" />
      <Circle cx="100" cy="100" r="42" fill="none" stroke={c.encre} strokeWidth="3.5" />
      <Path d={SECTEURS} fill={c.tomate} stroke={c.encre} strokeWidth="3.5" strokeLinejoin="round" />
      <Path d={REFLET} fill="none" stroke={c.blanc} strokeWidth="6" strokeLinecap="round" />
      <Circle cx="39.96" cy="68.08" r="3" fill={c.blanc} />
      {visages[expression]}
    </G>
  );
}
