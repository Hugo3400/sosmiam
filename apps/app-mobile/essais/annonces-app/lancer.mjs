import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ICI = new URL("./", import.meta.url);
const fichiers = readdirSync(ICI)
  .filter((nom) => nom.endsWith(".test.mjs"))
  .sort()
  .map((nom) => fileURLToPath(new URL(nom, ICI)));
if (fichiers.length === 0) {
  console.error(`Aucun essai (*.test.mjs) dans ${fileURLToPath(ICI)}`);
  process.exit(1);
}

const resultat = spawnSync(
  process.execPath,
  [
    "--experimental-strip-types",
    "--disable-warning=ExperimentalWarning",
    "--import",
    new URL("./banc/enregistrer.mjs", ICI).href,
    "--test",
    "--test-reporter=spec",
    "--test-timeout=30000",
    ...process.argv.slice(2),
    ...fichiers,
  ],
  { stdio: "inherit", timeout: 2 * 60_000 },
);
if (resultat.error) console.error(`Les essais n'ont pas pu tourner : ${resultat.error.message}`);
process.exit(resultat.status ?? 1);
