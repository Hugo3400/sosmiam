import type { TenueCapitaine } from "../../packages/commun/src/regles/themes-saison.ts";

export type ExpressionCapitaine = "miam" | "clin_doeil" | "cest_la_fete" | "coup_de_coeur";

export type AccessoiresTenue = {
  readonly base: ExpressionCapitaine;
  readonly derriere?: string;
  readonly casquette?: string;
  readonly devant?: string;
};

const ENCRE = "#1A1A1A";

const coeur = (x: number, y: number, s: number, c: string) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M10 18C10 18 0 11.5 0 5.5C0 1.5 3 -1 6 -1C8 -1 9.5 .5 10 2C10.5 .5 12 -1 14 -1C17 -1 20 1.5 20 5.5C20 11.5 10 18 10 18Z" fill="${c}" stroke="${ENCRE}" stroke-width="${2 / s}" stroke-linejoin="round"/>`;

const flocon = (x: number, y: number, r: number) =>
  `<g stroke="#5AA9E6" stroke-width="3" stroke-linecap="round">${[0, 60, 120].map((a) => `<path transform="translate(${x} ${y}) rotate(${a})" d="M0 ${-r}V${r}M-3 ${-r + 3}L0 ${-r + 6}L3 ${-r + 3}M-3 ${r - 3}L0 ${r - 6}L3 ${r - 3}"/>`).join("")}</g>`;

const point = (x: number, y: number, r: number, angle: number) => `${(x + r * Math.cos(angle)).toFixed(1)} ${(y + r * Math.sin(angle)).toFixed(1)}`;

const gerbe = (x: number, y: number, r1: number, r2: number, c: string) =>
  `<g stroke="${c}" stroke-width="3.5" stroke-linecap="round">${Array.from({ length: 8 }, (_, i) => `<path d="M${point(x, y, r1, (i * Math.PI) / 4)}L${point(x, y, r2, (i * Math.PI) / 4)}"/>`).join("")}<circle cx="${x}" cy="${y}" r="3" fill="${c}" stroke="none"/></g>`;

const etincelle = (x: number, y: number, r: number, c: string) =>
  `<path transform="translate(${x} ${y})" d="M0 ${-r}Q${r * 0.15} ${-r * 0.15} ${r} 0Q${r * 0.15} ${r * 0.15} 0 ${r}Q${-r * 0.15} ${r * 0.15} ${-r} 0Q${-r * 0.15} ${-r * 0.15} 0 ${-r}Z" fill="${c}" stroke="${ENCRE}" stroke-width="1.8" stroke-linejoin="round"/>`;

const serpentin = (x: number, y: number, c: string) =>
  `<path transform="translate(${x} ${y})" d="M0 0q12 6 2 15q-10 9 2 16q12 7 2 16q-8 7 0 14" fill="none" stroke="${c}" stroke-width="4.5" stroke-linecap="round"/>`;

const notes = (x: number, y: number, s: number, c: string) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="8" ry="6" transform="rotate(-20)" fill="${c}" stroke="${ENCRE}" stroke-width="2"/><ellipse cx="24" cy="-5" rx="8" ry="6" transform="rotate(-20 24 -5)" fill="${c}" stroke="${ENCRE}" stroke-width="2"/><path d="M7 -2V-32M31 -7V-37" stroke="${ENCRE}" stroke-width="3" stroke-linecap="round"/><path d="M7 -32L31 -37" stroke="${ENCRE}" stroke-width="7" stroke-linecap="round"/></g>`;

const chauveSouris = (x: number, y: number, s: number, r: number) =>
  `<path transform="translate(${x} ${y}) rotate(${r}) scale(${s})" d="M0 0Q6 -9 13 -3Q16 -12 20 -5L22 -10L24 -5L26 -10L28 -5Q32 -12 35 -3Q42 -9 48 0Q41 -1 37 6Q31 1 24 8Q17 1 11 6Q7 -1 0 0Z" fill="${ENCRE}"/>`;

const echarpe = (fond: string, rayure: string) =>
  `<path d="M22 128Q100 172 178 128L182 146Q100 192 18 146Z" fill="${fond}" stroke="${ENCRE}" stroke-width="3.5" stroke-linejoin="round"/><path d="M21 137Q100 182 180 137" fill="none" stroke="${rayure}" stroke-width="4.5" stroke-dasharray="10 7"/><path d="M136 160L128 210L152 214L158 156Z" fill="${fond}" stroke="${ENCRE}" stroke-width="3.5" stroke-linejoin="round"/><path d="M132 186L155 189" stroke="${rayure}" stroke-width="4.5"/><path d="M131 210l-2 9M137 211l-1 9M143 212l0 9M149 213l1 9" stroke="${ENCRE}" stroke-width="3" stroke-linecap="round"/>`;

const angleBranche = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / 5;

const ballonFoot = (x: number, y: number, r: number) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFFFFF" stroke="${ENCRE}" stroke-width="3.5"/><path d="M${Array.from({ length: 5 }, (_, i) => point(x, y, r * 0.36, angleBranche(i))).join("L")}Z" fill="${ENCRE}"/>${Array.from({ length: 5 }, (_, i) => `<path d="M${point(x, y, r * 0.36, angleBranche(i))}L${point(x, y, r * 0.95, angleBranche(i))}" stroke="${ENCRE}" stroke-width="2.5"/>`).join("")}`;

const houx = `<ellipse cx="70" cy="-2" rx="11" ry="5" transform="rotate(-30 70 -2)" fill="#2E8B57" stroke="${ENCRE}" stroke-width="2.5"/><ellipse cx="86" cy="-2" rx="11" ry="5" transform="rotate(30 86 -2)" fill="#2E8B57" stroke="${ENCRE}" stroke-width="2.5"/>${[[74, 4], [82, 5], [78, -1]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#C21E3A" stroke="${ENCRE}" stroke-width="1.8"/>`).join("")}`;

const couronne = `<path d="M66 -16L62 -50L82 -34L100 -57L118 -34L138 -50L134 -16Q100 -10 66 -16Z" fill="#F7C948" stroke="${ENCRE}" stroke-width="3.5" stroke-linejoin="round"/>${[[62, -52], [100, -59], [138, -52]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#F7C948" stroke="${ENCRE}" stroke-width="2.5"/>`).join("")}<circle cx="100" cy="-27" r="5" fill="#3BA3E0" stroke="${ENCRE}" stroke-width="2"/><circle cx="80" cy="-24" r="3.5" fill="#FF7EB6" stroke="${ENCRE}" stroke-width="2"/><circle cx="120" cy="-24" r="3.5" fill="#FF7EB6" stroke="${ENCRE}" stroke-width="2"/>`;

const crepe = `<g transform="rotate(-10 100 -66)"><ellipse cx="100" cy="-66" rx="32" ry="9" fill="#F2C27A" stroke="${ENCRE}" stroke-width="3.5"/><ellipse cx="88" cy="-67" rx="5" ry="2" fill="#D9984A"/><ellipse cx="108" cy="-64" rx="6" ry="2.2" fill="#D9984A"/><ellipse cx="116" cy="-69" rx="3.5" ry="1.6" fill="#D9984A"/></g><path d="M56 -48Q48 -62 58 -76M146 -82Q156 -68 148 -54" fill="none" stroke="${ENCRE}" stroke-width="3.5" stroke-linecap="round"/>`;

const oreillesLapin = [[78, -14], [122, 14]].map(([x, a]) => `<ellipse cx="${x}" cy="-44" rx="12" ry="30" transform="rotate(${a} ${x} -44)" fill="#FFFFFF" stroke="${ENCRE}" stroke-width="3.5"/><ellipse cx="${x}" cy="-46" rx="5.5" ry="20" transform="rotate(${a} ${x} -46)" fill="#FFB3CF"/>`).join("");

const oeufChocolat = `<ellipse cx="176" cy="178" rx="16" ry="20" fill="#7B4A2A" stroke="${ENCRE}" stroke-width="3.5"/><path d="M161 176l5 -5l5 5l5 -5l5 5l5 -5l5 5" fill="none" stroke="#FF7EB6" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M168 166Q170 162 174 161" fill="none" stroke="#FFFFFF" stroke-opacity=".5" stroke-width="2.5" stroke-linecap="round"/>`;

const citrouille = `<g transform="translate(178 182)"><path d="M-2 -18Q0 -26 6 -28" fill="none" stroke="#3C8D2F" stroke-width="5" stroke-linecap="round"/><ellipse cx="-10" cy="0" rx="12" ry="16" fill="#F28C28" stroke="${ENCRE}" stroke-width="3"/><ellipse cx="10" cy="0" rx="12" ry="16" fill="#F28C28" stroke="${ENCRE}" stroke-width="3"/><ellipse cx="0" cy="0" rx="12" ry="17" fill="#F7A03C" stroke="${ENCRE}" stroke-width="3"/><path d="M-7 -4l3 -5l3 5zM4 -4l3 -5l3 5z" fill="${ENCRE}"/><path d="M-7 5Q0 10 7 5" fill="none" stroke="${ENCRE}" stroke-width="2.5" stroke-linecap="round"/></g>`;

const ruban = `<g transform="translate(160 100) scale(1.3)">${[[ENCRE, 13], ["#F06BA8", 7.5]].map(([c, l]) => `<path d="M-12 27L4 -6C10 -18 6 -28 0 -28C-6 -28 -10 -18 -4 -6L12 27" fill="none" stroke="${c}" stroke-width="${l}" stroke-linejoin="round"/>`).join("")}</g>`;

const moustache = `<path transform="translate(0 -1)" d="M100 104C93 98 81 97 75 103C71 107 66 106 65 101C63 110 72 116 82 113C90 111 96 109 100 107C104 109 110 111 118 113C128 116 137 110 135 101C134 106 129 107 125 103C119 97 107 98 100 104Z" fill="${ENCRE}" stroke="${ENCRE}" stroke-width="1.5" stroke-linejoin="round"/>`;

const cocarde = `<circle cx="74" cy="21" r="10" fill="#2A55A8" stroke="${ENCRE}" stroke-width="2.2"/><circle cx="74" cy="21" r="6.5" fill="#FFFFFF"/><circle cx="74" cy="21" r="3.2" fill="#D4213D"/>`;

const ballonOvale = `<g transform="rotate(-30 182 172)"><ellipse cx="182" cy="172" rx="26" ry="15" fill="#B5651D" stroke="${ENCRE}" stroke-width="3.5"/><path d="M170 172H194M174 168v8M180 168v8M186 168v8M192 168v8" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/></g>`;

const croissant = `<g transform="translate(-6 178)"><ellipse cx="-15" cy="4" rx="10" ry="7" transform="rotate(30 -15 4)" fill="#E9A84C" stroke="${ENCRE}" stroke-width="3"/><ellipse cx="15" cy="4" rx="10" ry="7" transform="rotate(-30 15 4)" fill="#E9A84C" stroke="${ENCRE}" stroke-width="3"/><ellipse cx="0" cy="0" rx="14" ry="10" fill="#F2BC5E" stroke="${ENCRE}" stroke-width="3"/><path d="M-5 -8Q-8 0 -5 8M5 -8Q8 0 5 8" fill="none" stroke="#B9772B" stroke-width="2.2" stroke-linecap="round"/></g>`;

const jus = `<path d="M180 148L190 126L198 124" fill="none" stroke="#3BA3E0" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M162 144L194 144L189 198L167 198Z" fill="#FFFFFF" stroke="${ENCRE}" stroke-width="3.5" stroke-linejoin="round"/><path d="M164.6 160L191.4 160L188 194L168 194Z" fill="#FFA94D"/><circle cx="163" cy="146" r="10" fill="#FFC857" stroke="${ENCRE}" stroke-width="2.5"/><path d="M163 146l0 -8M163 146l7 4M163 146l-7 4" stroke="#E9A23B" stroke-width="2" stroke-linecap="round"/><path d="M170 168v20" stroke="#FFFFFF" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>`;

const lunettes = `<path d="M62 87L74 90M138 87L126 90" stroke="${ENCRE}" stroke-width="3" stroke-linecap="round"/><rect x="71" y="84" width="27" height="20" rx="8" fill="${ENCRE}"/><rect x="102" y="84" width="27" height="20" rx="8" fill="${ENCRE}"/><path d="M97 91Q100 87 103 91" fill="none" stroke="${ENCRE}" stroke-width="3"/><path d="M78 90L86 90M107 90L115 90" stroke="#FFFFFF" stroke-opacity=".7" stroke-width="2.5" stroke-linecap="round"/>`;

const poissonPapier = `<g transform="translate(30 116) rotate(-78)"><path d="M-22 0C-14 -13 10 -14 18 0C10 14 -14 13 -22 0Z" fill="#9FD8F5" stroke="${ENCRE}" stroke-width="2.8" stroke-linejoin="round"/><path d="M18 0L30 -10L28 10Z" fill="#9FD8F5" stroke="${ENCRE}" stroke-width="2.8" stroke-linejoin="round"/><circle cx="-12" cy="-2" r="2.4" fill="${ENCRE}"/><path d="M-2 -6Q2 0 -2 6M5 -6Q9 0 5 6" fill="none" stroke="${ENCRE}" stroke-width="2" stroke-linecap="round"/></g><rect x="20" y="78" width="18" height="9" rx="1.5" transform="rotate(-15 29 82)" fill="#FFF8E7" fill-opacity=".85" stroke="${ENCRE}" stroke-width="1.5"/>`;

export const ACCESSOIRES_TENUES: Readonly<Record<TenueCapitaine, AccessoiresTenue>> = {
  noel: { base: "clin_doeil", casquette: houx, devant: `${echarpe("#1F7A4D", "#FFF8E7")}${flocon(-22, -40, 11)}${flocon(212, 2, 9)}${flocon(-30, 70, 8)}${flocon(222, 120, 10)}` },
  "nouvel-an": { base: "cest_la_fete", devant: `${serpentin(-30, -70, "#3BA3E0")}${serpentin(214, -40, "#FF7EB6")}${serpentin(-36, 96, "#8C6CF0")}${etincelle(205, 92, 11, "#FFD60A")}${etincelle(-14, 30, 8, "#FFFFFF")}${etincelle(170, -82, 9, "#FFFFFF")}` },
  galette: { base: "miam", casquette: couronne },
  janvier: { base: "clin_doeil", devant: jus },
  chandeleur: { base: "miam", devant: crepe },
  "saint-valentin": { base: "coup_de_coeur", devant: `${coeur(-32, 12, 1.5, "#FF7EB6")}${coeur(-10, -48, 1, "#E8457A")}${coeur(190, 150, 1.3, "#FF7EB6")}${coeur(-26, 150, 0.9, "#E8457A")}` },
  paques: { base: "clin_doeil", derriere: oreillesLapin, devant: oeufChocolat },
  "poisson-d-avril": { base: "clin_doeil", devant: poissonPapier },
  musique: { base: "clin_doeil", devant: `${notes(-34, 30, 1, ENCRE)}${notes(182, -40, 0.9, "#2BB3A3")}${notes(196, 160, 0.75, "#8C6CF0")}` },
  "quatorze-juillet": { base: "miam", casquette: cocarde, devant: `${gerbe(-20, -48, 7, 20, "#2A55A8")}${gerbe(208, -30, 6, 17, "#D4213D")}${gerbe(-28, 150, 5, 14, "#F5B800")}` },
  ete: { base: "miam", devant: lunettes },
  halloween: { base: "miam", devant: `${chauveSouris(-44, -46, 1.5, -10)}${chauveSouris(170, -74, 1.1, 12)}${chauveSouris(196, 36, 0.85, -6)}${citrouille}` },
  movember: { base: "clin_doeil", devant: moustache },
  "octobre-rose": { base: "miam", devant: ruban },
  supporter: { base: "miam", devant: `${echarpe(ENCRE, "#FFD60A")}${ballonFoot(-10, 176, 21)}` },
  rugby: { base: "miam", devant: `${ballonOvale}${croissant}` },
  miam: { base: "miam" },
  "clin-d-oeil": { base: "clin_doeil" },
  fete: { base: "cest_la_fete" },
};
