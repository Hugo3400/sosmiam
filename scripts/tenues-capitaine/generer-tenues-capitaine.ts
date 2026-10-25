import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { TENUES_CAPITAINE, type TenueCapitaine } from "../../packages/commun/src/regles/themes-saison.ts";
import { ACCESSOIRES_TENUES, type ExpressionCapitaine } from "./accessoires-tenues.ts";

const RACINE = resolve(fileURLToPath(import.meta.url), "../../..");
const MASCOTTE = join(RACINE, "kits/SOS_Miam_kit_de_marque/02_Mascotte");
const SORTIE_KIT = join(RACINE, "kits/SOS_Miam_kit_de_marque/07_Tenues_du_Capitaine");
const SORTIE_APP = join(RACINE, "apps/app-mobile/assets/images/tenues-capitaine");
const SORTIE_SITE = join(RACINE, "apps/site-web/public/images/tenues-capitaine");
const LARGEUR = 300;
const HAUTEUR = 330;
const LARGEUR_KIT = 1024;
const LARGEUR_APP = 300;

function trouverChrome(): string {
  if (process.env.CHROME) return process.env.CHROME;
  const dossier = join(homedir(), ".cache/ms-playwright");
  const coquille = existsSync(dossier) ? readdirSync(dossier).filter((d) => d.startsWith("chromium_headless_shell-")).sort().pop() : undefined;
  const chemin = coquille ? join(dossier, coquille, "chrome-headless-shell-linux64/chrome-headless-shell") : "";
  if (!existsSync(chemin)) throw new Error("Chrome sans écran introuvable : installe-le (npx playwright install chromium-headless-shell) ou donne son chemin dans CHROME.");
  return chemin;
}

function lireExpression(expression: ExpressionCapitaine): string {
  const svg = readFileSync(join(MASCOTTE, `SOSMiam_Capitaine_Bouiboui_${expression}.svg`), "utf8").trim();
  if (expression !== "miam") return svg;
  return svg.replace(/<g stroke="#1A1A1A" stroke-width="4" stroke-linecap="round">(?:(?!<g ).)*?<\/g><\/svg>$/, "</svg>");
}

function dessinerTenue(tenue: TenueCapitaine): string {
  const accessoires = ACCESSOIRES_TENUES[tenue];
  const cadre = 'width="250" height="303" viewBox="-25 -78 250 303"';
  const expression = lireExpression(accessoires.base);
  if (!expression.includes(cadre)) throw new Error(`Cadre inattendu pour l'expression ${accessoires.base} du kit.`);
  let svg = expression.replace(cadre, `width="${LARGEUR}" height="${HAUTEUR}" viewBox="-50 -100 ${LARGEUR} ${HAUTEUR}"`);
  const casquette = svg.match(/<g transform="(translate\((?:100 31|98 -11)\)[^"]*)"/)?.[1];
  if (!casquette) throw new Error(`Casquette introuvable dans l'expression ${accessoires.base} du kit.`);
  if (accessoires.derriere) svg = svg.replace(`<g transform="${casquette}"`, `<g transform="${casquette}">${accessoires.derriere}</g><g transform="${casquette}"`);
  const devant = `${accessoires.casquette ? `<g transform="${casquette}">${accessoires.casquette}</g>` : ""}${accessoires.devant ?? ""}`;
  return svg.replace(/<\/svg>$/, `${devant}</svg>`);
}

const chrome = trouverChrome();
const travail = mkdtempSync(join(tmpdir(), "tenues-capitaine-"));

function capturer(svg: string, largeur: number, png: string): void {
  const hauteur = Math.round((largeur * HAUTEUR) / LARGEUR);
  const page = join(travail, "page.html");
  const image = svg.replace(`width="${LARGEUR}" height="${HAUTEUR}"`, `width="${largeur}" height="${hauteur}"`);
  writeFileSync(page, `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:transparent">${image}</body></html>`);
  execFileSync(chrome, ["--no-sandbox", "--hide-scrollbars", "--force-device-scale-factor=1", "--default-background-color=00000000", `--window-size=${largeur},${hauteur}`, `--screenshot=${png}`, `file://${page}`], { stdio: "ignore" });
}

for (const dossier of [SORTIE_KIT, SORTIE_APP, SORTIE_SITE]) {
  rmSync(dossier, { recursive: true, force: true });
  mkdirSync(dossier, { recursive: true });
}
for (const tenue of TENUES_CAPITAINE) {
  const svg = dessinerTenue(tenue);
  const nomKit = `SOSMiam_Capitaine_Bouiboui_tenue_${tenue}`;
  writeFileSync(join(SORTIE_KIT, `${nomKit}.svg`), svg);
  writeFileSync(join(SORTIE_SITE, `${tenue}.svg`), svg);
  capturer(svg, LARGEUR_KIT, join(SORTIE_KIT, `${nomKit}.png`));
  capturer(svg, LARGEUR_APP, join(SORTIE_APP, `${tenue}.png`));
}
rmSync(travail, { recursive: true, force: true });
console.log(`✅ ${TENUES_CAPITAINE.length} tenues du Capitaine dans ${SORTIE_KIT}, ${SORTIE_APP} et ${SORTIE_SITE}`);
