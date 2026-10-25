import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const RACINE = new URL("../../..", import.meta.url).pathname;
const SOURCES = ["apps/api/src/routes/gestion.ts", "apps/api/src/middlewares/proteger-gestion.ts", "apps/api/src/controleurs/gestion", "apps/api/src/services/gestion"];

function lister(chemin) {
  const infos = statSync(chemin);
  if (!infos.isDirectory()) return [{ chemin, modifie: infos.mtimeMs }];
  return readdirSync(chemin).flatMap((nom) => lister(join(chemin, nom)));
}

let demarrage = null;
try {
  const programmes = JSON.parse(execFileSync("pm2", ["jlist"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
  demarrage = programmes.find((p) => p.name === "sos-miam-api" && p.pm2_env?.status === "online")?.pm2_env?.pm_uptime ?? null;
} catch {}
if (!demarrage) {
  console.error("❌ Impossible de savoir quand l'API en ligne a démarré (sos-miam-api absente de pm2 ?). Publication arrêtée.");
  process.exit(1);
}

const recents = SOURCES.flatMap((source) => lister(join(RACINE, source))).filter((fichier) => fichier.modifie > demarrage).sort((a, b) => b.modifie - a.modifie);
const date = (ms) => new Date(ms).toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
if (recents.length > 0) {
  console.error(`❌ L'API en ligne a démarré le ${date(demarrage)}, mais sa partie gestion a changé depuis :`);
  for (const fichier of recents.slice(0, 10)) console.error(`   - ${relative(RACINE, fichier.chemin)} (${date(fichier.modifie)})`);
  if (recents.length > 10) console.error(`   … et ${recents.length - 10} autres`);
  console.error("Redémarre d'abord l'API (feu vert de Hugo et « stable » des sessions), sinon le logiciel risque d'appeler des routes absentes.");
  console.error("Si ces changements ne concernent pas le logiciel : SANS_VERIFIER_API=1 npm run gestion:installateur");
  process.exit(1);
}
console.log(`✅ L'API en ligne (démarrée le ${date(demarrage)}) a toute sa partie gestion.`);
