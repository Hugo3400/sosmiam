// Parties communes des avatars des Miamis, reprises de la mascotte du kit de marque (02_Mascotte) :
// la bouée (centrée en 100,100, rayon extérieur 86), les joues, les yeux et les bouches.
export const COULEURS = {
  jaune: "#FFD60A",
  tomate: "#FF4D3D",
  encre: "#1A1A1A",
  creme: "#FFF8E7",
  jauneClair: "#FFF1A8",
  ombre: "#F0B400",
  blanc: "#FFFFFF",
} as const;

const C = COULEURS;
const E = C.encre;
const T = `stroke="${E}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;

const corde = ["M166.323 55.265Q218 100 166.323 144.735", "M144.735 166.323Q100 218 55.265 166.323", "M33.677 144.735Q-18 100 33.677 55.265", "M55.265 33.677Q100 -18 144.735 33.677"]
  .map((d) => `<path d="${d}" stroke="${E}" stroke-width="8"/><path d="${d}" stroke="${C.creme}" stroke-width="4.5"/><path d="${d}" stroke="${E}" stroke-width="4.5" stroke-dasharray="1.5 4.5" stroke-opacity="0.5"/>`)
  .join("");

export const BOUEE = `<g fill="none" stroke-linecap="round">${corde}</g>
<circle cx="100" cy="100" r="62" fill="none" stroke="${C.jaune}" stroke-width="40"/>
<path d="M171.479 119.153A74 74 0 0 1 28.521 119.153" fill="none" stroke="${C.ombre}" stroke-width="12"/>
<circle cx="100" cy="100" r="40.5" fill="${C.creme}"/>
<circle cx="100" cy="100" r="82" fill="none" stroke="${E}" stroke-width="3.5"/>
<circle cx="100" cy="100" r="42" fill="none" stroke="${E}" stroke-width="3.5"/>
<path d="M172.932 145.573A86 86 0 0 1 145.573 172.932L122.257 135.618A42 42 0 0 0 135.618 122.257Z" fill="${C.tomate}" ${T}/>
<path d="M54.427 172.932A86 86 0 0 1 27.068 145.573L64.382 122.257A42 42 0 0 0 77.743 135.618Z" fill="${C.tomate}" ${T}/>
<path d="M27.068 54.427A86 86 0 0 1 54.427 27.068L77.743 64.382A42 42 0 0 0 64.382 77.743Z" fill="${C.tomate}" ${T}/>
<path d="M145.573 27.068A86 86 0 0 1 172.932 54.427L135.618 77.743A42 42 0 0 0 122.257 64.382Z" fill="${C.tomate}" ${T}/>
<path d="M36.101 123.257A68 68 0 0 1 36.101 76.743" fill="none" stroke="${C.blanc}" stroke-width="6" stroke-linecap="round"/>
<circle cx="39.96" cy="68.076" r="3" fill="${C.blanc}"/>`;

/** Les deux joues, décalées vers le bas de `dy` (sous des lunettes) */
export const dessinerJoues = (dy = 0, opacite = 0.45) =>
  `<ellipse cx="76" cy="${106 + dy}" rx="6" ry="3.5" fill="${C.tomate}" fill-opacity="${opacite}"/><ellipse cx="124" cy="${106 + dy}" rx="6" ry="3.5" fill="${C.tomate}" fill-opacity="${opacite}"/>`;

const oeilRond = (x: number) => `<ellipse cx="${x}" cy="94" rx="4.5" ry="6" fill="${E}"/><circle cx="${x + 1.6}" cy="91.6" r="1.6" fill="${C.blanc}"/>`;
const trait = (d: string, w = 3.5) => `<path d="${d}" fill="none" stroke="${E}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

export const YEUX = {
  ronds: oeilRond(87) + oeilRond(113),
  contents: trait("M81 97L87 91L93 97") + trait("M107 97L113 91L119 97"),
  fermes: trait("M81 93q6 6 12 0") + trait("M107 93q6 6 12 0"),
  clin: trait("M81 96L87 90L93 96") + oeilRond(113),
  coeur: `<path d="M87 100C77 93 81 84 87 90C93 84 97 93 87 100Z" fill="${C.tomate}" stroke="${E}" stroke-width="1.8" stroke-linejoin="round"/><path d="M113 100C103 93 107 84 113 90C119 84 123 93 113 100Z" fill="${C.tomate}" stroke="${E}" stroke-width="1.8" stroke-linejoin="round"/>`,
  borgne: oeilRond(113),
};

export const BOUCHES = {
  miam: `<path d="M88 105H112Q112 121 100 121Q88 121 88 105Z" fill="${E}"/><path d="M93 117Q100 110 107 117Q100 121.5 93 117Z" fill="${C.tomate}"/>`,
  sourire: trait("M88 105Q100 117 112 105", 4),
  langue: `<ellipse cx="106" cy="113" rx="4.5" ry="5.5" fill="${C.tomate}" stroke="${E}" stroke-width="2"/>` + trait("M88 105Q100 117 112 105", 4),
  petite: trait("M95 110q5 4 10 0", 3),
  o: `<ellipse cx="100" cy="112" rx="4.5" ry="5.5" fill="${E}"/>`,
  coin: trait("M91 116Q103 121 112 110", 4),
  dent: `<path d="M89 105H111Q111 119 100 119Q89 119 89 105Z" fill="${E}"/><path d="M93 105h5v4.5q-2.5 1.2-5 0Z" fill="${C.blanc}"/>`,
};
