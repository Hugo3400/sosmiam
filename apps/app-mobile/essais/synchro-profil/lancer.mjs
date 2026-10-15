// Lance tout le banc du moteur de synchro du profil (npm run essais:synchro, dans apps/app-mobile) : node --test, un
// processus par fichier *.test.mjs de ce dossier, le chargeur du banc branché (alias, TypeScript, doublures). Sort avec un
// code non nul au moindre échec, si un fichier ne se charge pas, ou si rien ne répond au bout de 5 minutes.
// Les options suivantes passent à node --test, par exemple : npm run essais:synchro -- --test-name-pattern="S5"
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
  { stdio: "inherit", timeout: 5 * 60_000 },
);
if (resultat.error) console.error(`Le banc n'a pas pu tourner : ${resultat.error.message}`);
process.exit(resultat.status ?? 1);
