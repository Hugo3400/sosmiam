// Les Miamis (avatars de l'app, validés par Hugo le 15/10/2026) : chaque avatar = la bouée + un visage + un couvre-chef ou un accessoire.
// Repère de la mascotte : bouée centrée en 100,100. Un couvre-chef se pose comme la casquette du Capitaine :
// il couvre le haut de la bouée et son bord bas plonge vers le centre (vers y = 46-52), le jaune de la bouée reste visible entre lui et le visage.
import { COULEURS as C, type BOUCHES, type YEUX } from "./parties-bouee.ts";

export type Miami = {
  id: string;
  nom: string;
  phrase: string;
  yeux: keyof typeof YEUX | null;
  bouche: keyof typeof BOUCHES | null;
  /** Opacité des joues (0,45 par défaut) */
  joues?: number;
  /** Joues descendues sous des lunettes */
  jouesDy?: number;
  /** Couvre-chef et accessoires, dessinés par-dessus le visage */
  dessus: string;
};

const E = C.encre;
const T = `stroke="${E}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;
const fin = (d: string, w = 2.5, couleur: string = E) => `<path d="${d}" fill="none" stroke="${couleur}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const forme = (d: string, fill: string) => `<path d="${d}" fill="${fill}" ${T}/>`;
const penche = (angle: number, contenu: string, cx = 100, cy = 30) => `<g transform="rotate(${angle} ${cx} ${cy})">${contenu}</g>`;

const note = (x: number, y: number, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="6" ry="4.6" transform="rotate(-20)" fill="${E}"/><path d="M5 -1.5V-24L15 -19" fill="none" stroke="${E}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></g>`;

/** Pompon de laine : un rond festonné (petits arcs tournés vers l'extérieur) */
function pomponLaine(cx: number, cy: number, r: number, bosses: number, fill: string) {
  const pas = (2 * Math.PI) / bosses;
  const rayonBosse = (r * Math.sin(pas / 2) * 1.15).toFixed(2);
  const point = (k: number) => `${(cx + r * Math.cos(k * pas)).toFixed(2)} ${(cy + r * Math.sin(k * pas)).toFixed(2)}`;
  let d = `M${point(0)}`;
  for (let k = 1; k <= bosses; k++) d += `A${rayonBosse} ${rayonBosse} 0 0 1 ${point(k)}`;
  return `<path d="${d}Z" fill="${fill}" ${T}/>` + fin(`M${cx - r * 0.4} ${cy - r * 0.1}q${r * 0.3} ${-r * 0.3} ${r * 0.6} 0`, 2, C.ombre);
}

export const MIAMIS: Miami[] = [
  {
    id: "toque",
    nom: "Toque",
    phrase: "Aux fourneaux depuis l'apéro.",
    yeux: "ronds",
    bouche: "miam",
    dessus: penche(
      -5,
      forme("M62 9C36 8 34 -22 60 -20C60 -40 96 -46 104 -30C116 -46 156 -38 146 -18C170 -12 164 12 138 9Q100 16 62 9Z", C.blanc) +
        fin("M82 7Q79 -4 84 -14") + fin("M100 9Q99 -4 103 -16") + fin("M118 7Q121 -4 117 -14") +
        forme("M60 38L62 7Q100 14 138 7L140 38Q100 52 60 38Z", C.blanc) +
        fin("M63 29Q100 40 137 29", 2.5, C.ombre),
    ),
  },
  {
    id: "pompon",
    nom: "Pompon",
    phrase: "Moussaillon de la Brigade, toujours sur le pont.",
    yeux: "clin",
    bouche: "langue",
    dessus:
      // Ruban qui fait le tour de la tête (ses bouts s'affinent vers l'arrière), puis le plateau blanc et le pompon
      forme("M62 22Q100 32 138 22L136 40Q100 52 64 40Z", E) +
      fin("M66 33Q100 43 134 33", 2.2, C.jaune) +
      penche(
        -5,
        forme("M40 12C40 -2 66 -10 100 -10C134 -10 160 -2 160 12C160 24 134 30 100 30C66 30 40 24 40 12Z", C.blanc) +
          `<path d="M44 16C52 25 76 29 100 29C124 29 148 25 156 16C150 21 128 24 100 24C72 24 50 21 44 16Z" fill="${C.creme}"/>` +
          forme("M40 12C40 -2 66 -10 100 -10C134 -10 160 -2 160 12C160 24 134 30 100 30C66 30 40 24 40 12Z", "none") +
          `<circle cx="100" cy="-14" r="11" fill="${C.tomate}" ${T}/>` + fin("M95 -18q4 -3 8 0", 2, "rgba(255,255,255,0.6)"),
        100,
        14,
      ),
  },
  {
    id: "beret",
    nom: "Béret",
    phrase: "Un café en terrasse, et je refais le monde.",
    yeux: "ronds",
    bouche: "sourire",
    // Béret basque penché sur la droite : il déborde du côté droit et son bord épouse la tête
    dessus: penche(
      -6,
      forme("M50 40C38 34 34 16 52 4C70 -8 132 -12 160 0C182 10 178 30 158 37Q130 49 100 49Q72 49 50 40Z", E) +
        fin("M56 39Q100 53 154 36", 3, "rgba(255,255,255,0.22)") +
        fin("M64 6Q90 -4 122 -4", 3, "rgba(255,255,255,0.45)") +
        fin("M106 -9Q106 -17 112 -20", 4.5),
      100,
      20,
    ),
  },
  {
    id: "galette",
    nom: "Galette",
    phrase: "J'ai eu la fève : c'est moi qui choisis le resto.",
    yeux: "coeur",
    bouche: "miam",
    dessus: penche(
      7,
      forme("M60 40L54 -4L76 14L88 -18L100 8L112 -18L124 14L146 -4L140 40Q100 52 60 40Z", C.jaune) +
        `<path d="M59.4 33Q100 44 140.6 33L140 40Q100 52 60 40Z" fill="${C.ombre}"/>` +
        forme("M60 40L54 -4L76 14L88 -18L100 8L112 -18L124 14L146 -4L140 40Q100 52 60 40Z", "none") +
        fin("M58 24Q100 35 142 24") +
        `<circle cx="80" cy="31" r="3.6" fill="${C.creme}" stroke="${E}" stroke-width="2"/><circle cx="100" cy="34" r="4.2" fill="${C.tomate}" stroke="${E}" stroke-width="2"/><circle cx="120" cy="31" r="3.6" fill="${C.creme}" stroke="${E}" stroke-width="2"/>` +
        [[54, -4], [88, -18], [112, -18], [146, -4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="${C.creme}" stroke="${E}" stroke-width="2.5"/>`).join(""),
    ),
  },
  {
    id: "paille",
    nom: "Paille",
    phrase: "Chapeau de paille et marché du dimanche.",
    yeux: "contents",
    bouche: "sourire",
    // Paille dorée (jaune et son ombre) pour ne pas se fondre dans un fond jaune clair ou crème
    dessus: penche(
      -6,
      forme("M22 30C22 18 58 12 100 12C142 12 178 18 178 30C178 42 142 48 100 48C58 48 22 42 22 30Z", C.jaune) +
        `<path d="M26 34C34 42 64 47 100 47C136 47 166 42 174 34C168 44 138 50 100 50C62 50 32 44 26 34Z" fill="${C.ombre}"/>` +
        forme("M22 30C22 18 58 12 100 12C142 12 178 18 178 30C178 42 142 48 100 48C58 48 22 42 22 30Z", "none") +
        fin("M38 26l9 2M56 21l9 1M135 22l9 -1M153 28l9 -2M46 38l8 2M146 40l8 -2", 2.2, C.ombre) +
        forme("M64 32C62 0 72 -18 100 -18C128 -18 138 0 136 32Q100 42 64 32Z", C.jaune) +
        fin("M80 -6l6 -3M108 -12l7 2M118 4l6 1M76 6l-6 2M96 -2l6 0", 2.2, C.ombre) +
        `<path d="M64.6 18Q100 28 135.4 18L136 30Q100 40 64 30Z" fill="${E}"/>`,
    ),
  },
  {
    id: "platine",
    nom: "Platine",
    phrase: "Toujours une playlist prête pour l'apéro.",
    yeux: "fermes",
    bouche: "miam",
    // Serre-tête posé sur la bouée (même centre), écouteurs plaqués sur les côtés
    dessus:
      fin("M8 100A92 92 0 0 1 192 100", 13) +
      fin("M8 100A92 92 0 0 1 192 100", 5, C.jaune) +
      `<rect x="-6" y="72" width="28" height="56" rx="12" fill="${E}"/><rect x="14" y="78" width="13" height="44" rx="6.5" fill="${C.jaune}" ${T}/>` +
      `<rect x="178" y="72" width="28" height="56" rx="12" fill="${E}"/><rect x="173" y="78" width="13" height="44" rx="6.5" fill="${C.jaune}" ${T}/>` +
      note(162, -6, 1) + note(184, 18, 0.8),
  },
  {
    id: "solaire",
    nom: "Solaire",
    phrase: "Toujours côté soleil, même en novembre.",
    yeux: null,
    bouche: "coin",
    jouesDy: 8,
    dessus:
      fin("M70 89L59 85M130 89L141 85", 3.5) +
      forme("M70 85H98V93Q98 106 84 106Q70 106 70 93Z", E) +
      forme("M102 85H130V93Q130 106 116 106Q102 106 102 93Z", E) +
      fin("M97 89Q100 86 103 89", 3.5) +
      fin("M75 99L83 90M107 99L115 90", 2.4, "rgba(255,255,255,0.75)"),
  },
  {
    id: "pirate",
    nom: "Pirate",
    phrase: "À l'abordage… du buffet à volonté.",
    yeux: "borgne",
    bouche: "dent",
    // La sangle du cache-œil passe sous le bandana ; le bandana suit la tête (bord bas qui plonge au centre)
    dessus:
      fin("M60 86L79 91M95 89L140 50", 2.5) +
      forme("M50 42C44 8 72 -8 100 -8C128 -8 156 8 150 42Q100 58 50 42Z", E) +
      [[72, 12], [92, 2], [114, 4], [134, 18], [82, 26], [106, 22], [62, 30], [142, 34], [96, 42], [122, 38]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="${C.creme}"/>`).join("") +
      forme("M148 30L172 18L170 38Z", E) + forme("M148 36L170 50L156 54Z", E) +
      `<circle cx="150" cy="34" r="6.5" fill="${E}"/>` +
      `<ellipse cx="87" cy="94" rx="9" ry="8.5" fill="${E}"/>`,
  },
  {
    id: "fiesta",
    nom: "Fiesta",
    phrase: "Un anniv' ? J'arrive avec les confettis.",
    yeux: "contents",
    bouche: "miam",
    dessus:
      forme("M74 32L106 -40L132 26Q104 40 74 32Z", C.jaune) +
      [[104, -22, C.tomate], [96, -2, C.creme], [114, -4, C.tomate], [90, 16, C.tomate], [106, 12, C.creme], [120, 14, C.creme]]
        .map(([x, y, f]) => `<circle cx="${x}" cy="${y}" r="4.2" fill="${f}" stroke="${E}" stroke-width="1.6"/>`)
        .join("") +
      pomponLaine(106, -44, 8, 8, C.creme) +
      `<rect x="34" y="-14" width="10" height="5" rx="1" fill="${C.tomate}" stroke="${E}" stroke-width="1.5" transform="rotate(30 39 -12)"/>` +
      `<rect x="156" y="-6" width="10" height="5" rx="1" fill="${C.jaune}" stroke="${E}" stroke-width="1.5" transform="rotate(-25 161 -4)"/>` +
      `<circle cx="48" cy="-36" r="3.5" fill="${C.jaune}" stroke="${E}" stroke-width="1.5"/><circle cx="160" cy="-34" r="3" fill="${C.tomate}" stroke="${E}" stroke-width="1.5"/>`,
  },
  {
    id: "bob",
    nom: "Bob",
    phrase: "Pêche du jour ou frites ? Les deux, merci.",
    yeux: "ronds",
    bouche: "sourire",
    dessus: penche(
      5,
      forme("M64 30C62 0 74 -16 100 -16C126 -16 138 0 136 30Z", C.creme) +
        `<path d="M63.2 16Q100 24 136.8 16L137 28Q100 36 63 28Z" fill="${C.jaune}" stroke="${E}" stroke-width="2.5" stroke-linejoin="round"/>` +
        forme("M42 44Q50 22 64 26Q100 34 136 26Q150 22 158 44Q100 60 42 44Z", C.creme) +
        `<path d="M52 42Q100 54 148 42" fill="none" stroke="${E}" stroke-width="1.6" stroke-dasharray="3 3"/>` +
        `<g transform="translate(110 2)"><path d="M-8 0Q0 -7 8 0Q0 7 -8 0Z" fill="${C.jauneClair}" stroke="${E}" stroke-width="2" stroke-linejoin="round"/><path d="M7 0L14 -5V5Z" fill="${C.jauneClair}" stroke="${E}" stroke-width="2" stroke-linejoin="round"/><circle cx="-3.5" cy="-1" r="1.3" fill="${E}"/></g>`,
    ),
  },
  {
    id: "raclette",
    nom: "Raclette",
    phrase: "Il fait froid ? Parfait, c'est soir de raclette.",
    yeux: "ronds",
    bouche: "langue",
    joues: 0.75,
    dessus:
      forme("M58 36C54 -6 78 -22 100 -22C122 -22 146 -6 142 36Z", C.creme) +
      fin("M59 22Q100 12 141 22M62 4Q100 -6 138 4", 6, C.jaune) +
      forme("M58 36C54 -6 78 -22 100 -22C122 -22 146 -6 142 36Z", "none") +
      forme("M54 46L56 26Q100 36 144 26L146 46Q100 58 54 46Z", C.jaune) +
      fin("M66 31L65 49M80 34L79 52M94 35L94 53M108 35L108 53M122 34L123 52M136 31L137 49", 2, C.ombre) +
      pomponLaine(100, -30, 10, 9, C.jaune),
  },
  {
    id: "moustache",
    nom: "Moustache",
    phrase: "Une table pour la Brigade ? Suis\u2011moi.",
    yeux: "ronds",
    bouche: null,
    dessus:
      penche(
        6,
        // Calotte qui descend jusque dans le bord (pas de jour entre les deux), bord roulé des deux côtés
        forme("M70 40L74 -34Q100 -38 126 -34L130 40Z", E) +
          `<path d="M71.6 16L128.4 16L129.2 30L70.8 30Z" fill="${C.jaune}"/>` +
          fin("M80 -26Q92 -29 104 -29", 3, "rgba(255,255,255,0.45)") +
          forme("M44 32C42 42 52 48 66 46Q100 52 134 46C148 48 158 42 156 32Q132 40 100 40Q68 40 44 32Z", E),
        100,
        20,
      ) +
      `<path d="M100 104C93 98 81 97 75 103C71 107 66 106 65 101C63 110 72 116 82 113C90 111 96 109 100 107C104 109 110 111 118 113C128 116 137 110 135 101C134 106 129 107 125 103C119 97 107 98 100 104Z" fill="${E}" stroke="${E}" stroke-width="1.5" stroke-linejoin="round"/>` +
      forme("M100 152L80 140L80 164Z", E) + forme("M100 152L120 140L120 164Z", E) + `<circle cx="100" cy="152" r="5.5" fill="${C.jaune}" ${T}/>`,
  },
  {
    id: "chantilly",
    nom: "Chantilly",
    phrase: "La cerise sur le gâteau, c'est moi.",
    yeux: "contents",
    bouche: "langue",
    dessus: penche(
      -4,
      forme("M56 40C42 34 46 14 62 16C56 0 74 -10 86 -2C88 -16 112 -16 114 -2C126 -10 144 0 138 16C154 14 158 34 144 40Q100 52 56 40Z", C.blanc) +
        `<path d="M58 38Q100 48 142 38Q144 32 140 28Q100 40 60 28Q56 32 58 38Z" fill="${C.creme}"/>` +
        fin("M68 26Q84 18 100 24M100 24Q116 18 132 26M84 6Q100 0 116 6") +
        `<path d="M106 -32Q110 -46 122 -50" fill="none" stroke="${E}" stroke-width="3" stroke-linecap="round"/>` +
        `<circle cx="103" cy="-22" r="10.5" fill="${C.tomate}" ${T}/><circle cx="99" cy="-26" r="2.6" fill="${C.blanc}"/>`,
    ),
  },
  {
    id: "binocles",
    nom: "Binocles",
    phrase: "J'ai révisé toutes les cartes des desserts.",
    yeux: "ronds",
    bouche: "o",
    // Toque de diplômé (calotte, plateau et gland) + lunettes rondes
    dessus:
      forme("M66 42L68 14Q100 22 132 14L134 42Q100 54 66 42Z", E) +
      forme("M100 -8L164 10L100 28L36 10Z", E) +
      fin("M46 10L100 -3", 2.4, "rgba(255,255,255,0.35)") +
      fin("M100 10L154 14V40", 2.6, C.jaune) +
      `<circle cx="100" cy="10" r="4" fill="${C.jaune}" stroke="${E}" stroke-width="2"/>` +
      `<path d="M149 38H159L161 52H147Z" fill="${C.jaune}" stroke="${E}" stroke-width="2" stroke-linejoin="round"/>` +
      fin("M76 92L61 88M124 92L139 88", 3) +
      `<circle cx="87" cy="94" r="11.5" fill="${C.blanc}" fill-opacity="0.35" stroke="${E}" stroke-width="3"/>` +
      `<circle cx="113" cy="94" r="11.5" fill="${C.blanc}" fill-opacity="0.35" stroke="${E}" stroke-width="3"/>` +
      fin("M98.5 92Q100 89.5 101.5 92", 3) +
      fin("M78 77Q86 73 94 76", 3),
  },
  {
    id: "marmotte",
    nom: "Marmotte",
    phrase: "Une petite sieste, et après on va goûter.",
    yeux: "fermes",
    bouche: "petite",
    dessus:
      forme("M58 34C54 0 76 -14 104 -14C134 -14 160 -2 178 38L170 42C160 22 148 14 140 18C144 24 145 29 144 34Z", C.creme) +
      fin("M80 -8Q90 6 86 30M118 -12Q128 4 124 32M152 4Q150 14 140 18", 4, C.jaune) +
      forme("M58 34C54 0 76 -14 104 -14C134 -14 160 -2 178 38L170 42C160 22 148 14 140 18C144 24 145 29 144 34Z", "none") +
      forme("M54 46L56 28Q100 38 144 28L146 46Q100 58 54 46Z", C.blanc) +
      pomponLaine(176, 46, 9, 8, C.jaune) +
      fin("M20 -12h12l-12 14h12", 3.5) + fin("M38 -36h8l-8 9h8", 3),
  },
  {
    id: "tuba",
    nom: "Tuba",
    phrase: "Je plonge direct dans la carte des desserts.",
    yeux: "ronds",
    bouche: null,
    dessus:
      fin("M66 90Q40 84 18 92M134 90Q160 84 182 92", 7) +
      `<path d="M66 82Q66 74 76 74H124Q134 74 134 82V98Q134 108 124 108L108 106Q100 101 92 106L76 108Q66 108 66 98Z" fill="${C.blanc}" fill-opacity="0.4" stroke="${E}" stroke-width="4" stroke-linejoin="round"/>` +
      fin("M73 82L80 78", 2.4, C.blanc) +
      fin("M104 118Q126 124 150 110V18Q150 8 160 8", 12) +
      fin("M104 118Q126 124 150 110V18Q150 8 160 8", 6, C.jaune) +
      `<ellipse cx="100" cy="117" rx="8" ry="6" fill="${E}"/>` +
      `<circle cx="174" cy="-4" r="4" fill="none" stroke="${E}" stroke-width="2"/><circle cx="182" cy="-18" r="2.6" fill="none" stroke="${E}" stroke-width="2"/>`,
  },
];

// Le Capitaine Bouiboui, tel que dans le kit de marque : réservé au compte officiel
export const CAPITAINE: Miami = {
  id: "capitaine",
  nom: "Capitaine Bouiboui",
  phrase: "Chef de la Brigade. La casquette, c'est la sienne.",
  yeux: "ronds",
  bouche: "miam",
  dessus: `<g transform="translate(100 31) rotate(7) translate(-100 -31)"><path d="M60 10C46 9 37 -3 47 -12C66 -27 134 -27 153 -12C163 -3 154 9 140 10Q100 18 60 10Z" fill="#FFFFFF"/><path d="M60 10Q100 18 140 10C149 9.5 154.5 5 154.6 0.5Q100 11 45.6 0.5C45.8 5 51 9.5 60 10Z" fill="#FFF8E7"/><path d="M60 10C46 9 37 -3 47 -12C66 -27 134 -27 153 -12C163 -3 154 9 140 10Q100 18 60 10Z" fill="none" stroke="#1A1A1A" stroke-width="3.5" stroke-linejoin="round"/><path d="M64 -17Q80 -23 98 -23.5" fill="none" stroke="#FFF8E7" stroke-width="3" stroke-linecap="round"/><path d="M58 31L60 10Q100 18 140 10L142 31Q100 41 58 31Z" fill="#1A1A1A" stroke="#1A1A1A" stroke-width="3.5" stroke-linejoin="round"/><g fill="none" stroke="#FFD60A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="100" cy="18.2" r="2.3"/><path d="M100 20.5V30.4"/><path d="M95.6 22.8H104.4"/><path d="M93.6 26.2Q94.6 30.6 100 30.6Q105.4 30.6 106.4 26.2"/></g><path d="M62 28.4Q100 37.6 138 28.4" fill="none" stroke="#FFD60A" stroke-width="3" stroke-linecap="round"/><circle cx="61.6" cy="28.6" r="3" fill="#FFD60A" stroke="#1A1A1A" stroke-width="1.5"/><circle cx="138.4" cy="28.6" r="3" fill="#FFD60A" stroke="#1A1A1A" stroke-width="1.5"/><path d="M56.5 31Q100 41.5 143.5 31Q100 61 56.5 31Z" fill="#1A1A1A" stroke="#1A1A1A" stroke-width="3.5" stroke-linejoin="round"/><path d="M71 40Q84 44.6 97 45" fill="none" stroke="#FFFFFF" stroke-opacity="0.55" stroke-width="2.4" stroke-linecap="round"/></g>`,
};
