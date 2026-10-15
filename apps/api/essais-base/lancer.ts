// Lance tous les essais sur base (essais/*.ts), chacun dans son propre processus et sa propre base PGlite en mémoire, deux à
// la fois ; un résumé à la fin (migrations rejouées, vérifications par essai), code 1 au moindre échec.
//   npm run api:essais-base                  (depuis la racine du dépôt)
//   npm run api:essais-base -- avis menage   (seulement les essais dont le nom contient l'un de ces mots)
// Jamais dans api:verifier : à lancer à part, avant une migration ou après un changement des services Prisma.
import { forkDuLanceur } from "./socle/garde-fou.ts";
import { readdirSync } from "node:fs";
import { availableParallelism } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { listerMigrations } from "./socle/migrations-depot.ts";
import type { BilanEssai } from "./socle/verifications.ts";

const DOSSIER_ESSAIS = fileURLToPath(new URL("./essais/", import.meta.url));
const DOSSIER_API = fileURLToPath(new URL("../", import.meta.url));
const GARDE_FOU = new URL("./socle/garde-fou.ts", import.meta.url).href;
const DELAI_MAX_MS = 240_000;
// Deux à la fois : plus, ils se disputent les processeurs (PGlite et Prisma en prennent plusieurs) et le VPS sert aussi le site
const EN_MEME_TEMPS = Math.max(1, Math.min(2, availableParallelism() - 1));

type Resultat = { nom: string; bilan: BilanEssai | null; code: number | null; sortie: string; duree: number };

const mots = process.argv.slice(2);
const essais = readdirSync(DOSSIER_ESSAIS).filter((f) => f.endsWith(".ts")).sort()
  .filter((f) => mots.length === 0 || mots.some((mot) => f.includes(mot)));
if (essais.length === 0) {
  console.error(`Aucun essai ne correspond à « ${mots.join(" ")} » (essais : ${readdirSync(DOSSIER_ESSAIS).join(", ")}).`);
  process.exit(1);
}

function lancerEssai(fichier: string): Promise<Resultat> {
  const debut = performance.now();
  return new Promise((fini) => {
    const enfant = forkDuLanceur(join(DOSSIER_ESSAIS, fichier), {
      cwd: DOSSIER_API,
      execArgv: ["--experimental-strip-types", "--disable-warning=ExperimentalWarning", "--import", GARDE_FOU],
      stdio: ["ignore", "pipe", "pipe", "ipc"],
    });
    let sortie = "";
    let bilan: BilanEssai | null = null;
    enfant.stdout!.on("data", (morceau) => (sortie += morceau));
    enfant.stderr!.on("data", (morceau) => (sortie += morceau));
    enfant.on("message", (message) => (bilan = message as BilanEssai));
    const minuterie = setTimeout(() => {
      sortie += `\n(arrêté au bout de ${DELAI_MAX_MS / 1000} s)`;
      enfant.kill("SIGKILL");
    }, DELAI_MAX_MS);
    enfant.on("exit", (code) => {
      clearTimeout(minuterie);
      fini({ nom: fichier.replace(/\.ts$/, ""), bilan, code, sortie, duree: (performance.now() - debut) / 1000 });
    });
  });
}

const debut = performance.now();
const resultats: Resultat[] = [];
const file = [...essais];
await Promise.all(Array.from({ length: Math.min(EN_MEME_TEMPS, file.length) }, async () => {
  for (let fichier = file.shift(); fichier !== undefined; fichier = file.shift()) resultats.push(await lancerEssai(fichier));
}));
resultats.sort((a, b) => a.nom.localeCompare(b.nom));

const reussi = (r: Resultat) => r.code === 0 && r.bilan !== null;
const enEchec = resultats.filter((r) => !reussi(r));
for (const r of enEchec) {
  const pourquoi = r.code === 0 ? "il s'est arrêté sans rendre son bilan (terminerEssai manque ?)" : `code de sortie ${r.code ?? "aucun (arrêté)"}`;
  console.error(`\n━━━ ${r.nom} : ÉCHEC, ${pourquoi}\n${r.sortie.trim().split("\n").slice(-60).join("\n")}`);
}
const largeur = Math.max(...resultats.map((r) => r.nom.length));
const virgule = (n: number) => n.toFixed(1).replace(".", ",");
console.log(`\nEssais sur base : PGlite en mémoire, les ${listerMigrations().length} migrations du dépôt rejouées dans chaque essai, aucune vraie base`);
for (const r of resultats) {
  const verdict = reussi(r) ? "ok    " : "ÉCHEC ";
  const nombre = r.bilan ? `${String(r.bilan.verifications).padStart(4)} vérifications` : "                 ";
  console.log(`  ${verdict} ${r.nom.padEnd(largeur)}  ${nombre}  ${virgule(r.duree).padStart(5)} s`);
}
const total = resultats.reduce((somme, r) => somme + (r.bilan?.verifications ?? 0), 0);
console.log(`Total : ${resultats.length} essai(s), ${total} vérifications, ${virgule((performance.now() - debut) / 1000)} s.`
  + (enEchec.length === 0 ? " Tout est bon." : ` ${enEchec.length} en échec : ${enEchec.map((r) => r.nom).join(", ")}.`));
process.exit(enEchec.length === 0 ? 0 : 1);
