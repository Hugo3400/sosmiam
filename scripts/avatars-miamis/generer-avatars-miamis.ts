// Refait kits/SOS_Miam_kit_de_marque/06_Avatars_des_Miamis : chaque Miami et le Capitaine en SVG et en PNG 1024 px
// (rond jaune clair, transparent autour), et la planche des seize en 1080 × 1350.
// Usage : node scripts/avatars-miamis/generer-avatars-miamis.ts   (Chrome sans écran de Playwright, ou son chemin dans CHROME)
// Ensuite, pour l'Espace presse du logiciel : python3 -I scripts/presse/assembler-presse.py <travail> --depuis-presse
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { dessinerMiami, dessinerSvgMiami } from "./dessiner-miami.ts";
import { CAPITAINE, MIAMIS, type Miami } from "./miamis.ts";
import { COULEURS } from "./parties-bouee.ts";

const RACINE = resolve(fileURLToPath(import.meta.url), "../../..");
const SORTIE = join(RACINE, "kits/SOS_Miam_kit_de_marque/06_Avatars_des_Miamis");
const POLICE = join(RACINE, "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2");
const TAILLE = 1024;

function trouverChrome(): string {
  if (process.env.CHROME) return process.env.CHROME;
  const dossier = join(homedir(), ".cache/ms-playwright");
  const coquille = existsSync(dossier) ? readdirSync(dossier).filter((d) => d.startsWith("chromium_headless_shell-")).sort().pop() : undefined;
  const chemin = coquille ? join(dossier, coquille, "chrome-headless-shell-linux64/chrome-headless-shell") : "";
  if (!existsSync(chemin)) throw new Error("Chrome sans écran introuvable : installe-le (npx playwright install chromium-headless-shell) ou donne son chemin dans CHROME.");
  return chemin;
}

const chrome = trouverChrome();
const travail = mkdtempSync(join(tmpdir(), "avatars-miamis-"));

/** Capture une page HTML en PNG à sa taille exacte, fond transparent */
function capturer(html: string, largeur: number, hauteur: number, png: string): void {
  const page = join(travail, "page.html");
  writeFileSync(page, `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:transparent">${html}</body></html>`);
  execFileSync(chrome, ["--no-sandbox", "--hide-scrollbars", "--force-device-scale-factor=1", "--default-background-color=00000000", `--window-size=${largeur},${hauteur}`, `--screenshot=${png}`, `file://${page}`], { stdio: "ignore" });
}

function enregistrer(miami: Miami, nom: string): void {
  const svg = dessinerSvgMiami(miami, COULEURS.jauneClair, TAILLE);
  writeFileSync(join(SORTIE, `${nom}.svg`), svg);
  capturer(svg, TAILLE, TAILLE, join(SORTIE, `${nom}.png`));
}

/** Les seize Miamis sur une image 4:5 (1080 × 1350), avec leur nom : aucune date, aucune promesse */
function planche(): string {
  const cases = MIAMIS.map(
    (m) => `<div class="m"><svg viewBox="0 0 200 200" width="196" height="196"><defs><clipPath id="p-${m.id}"><circle cx="100" cy="100" r="98"/></clipPath></defs><g clip-path="url(#p-${m.id})"><circle cx="100" cy="100" r="98" fill="${COULEURS.jauneClair}"/>${dessinerMiami(m)}</g><circle cx="100" cy="100" r="98" fill="none" stroke="${COULEURS.encre}" stroke-width="3"/></svg><span>${m.nom}</span></div>`,
  ).join("");
  return `<style>@font-face{font-family:Inter;src:url("file://${POLICE}") format("woff2");font-weight:100 900}
.p{width:1080px;height:1350px;box-sizing:border-box;background:${COULEURS.creme};font-family:Inter,sans-serif;color:${COULEURS.encre};padding:0 56px;display:flex;flex-direction:column;align-items:center;justify-content:center}
h1{margin:0 0 40px;font-size:84px;font-weight:900;letter-spacing:-3px;line-height:1}h1 span{background:linear-gradient(transparent 58%,${COULEURS.jaune} 58% 90%,transparent 90%);padding:0 6px}
.g{display:grid;grid-template-columns:repeat(4,1fr);gap:26px 34px}.m{display:flex;flex-direction:column;align-items:center;gap:10px}.m span{font-size:30px;font-weight:800}</style>
<div class="p"><h1>Les <span>Miamis</span></h1><div class="g">${cases}</div></div>`;
}

rmSync(SORTIE, { recursive: true, force: true });
mkdirSync(SORTIE, { recursive: true });
for (const miami of MIAMIS) enregistrer(miami, `SOSMiam_Miami_${miami.id}`);
enregistrer(CAPITAINE, "SOSMiam_Capitaine_Bouiboui_avatar");
capturer(planche(), 1080, 1350, join(SORTIE, "SOSMiam_Miamis_planche.png"));
rmSync(travail, { recursive: true, force: true });
console.log(`✅ ${MIAMIS.length} Miamis, le Capitaine et la planche dans ${SORTIE}`);
