// Range une copie d'un mail parti dans le dossier « Envoyés » de bonjour@sosmiam.fr (IMAP, par scripts/lire-boite-mail.py),
// pour le relire dans le logiciel de gestion ou le webmail (décidé par Hugo le 14 octobre 2026 : tous les mails, même
// automatiques ; les liens personnels masqués ; une seule copie par envoi groupé). Jamais bloquant : si la boîte ne répond
// pas, le mail est quand même parti, la copie manque, c'est tout.
import { spawn } from "node:child_process";
import { join } from "node:path";

import { FICHIER_BOITE_MAIL } from "./reglages-envoi.ts";

const SCRIPT = join(import.meta.dirname, "..", "..", "..", "..", "..", "scripts", "lire-boite-mail.py");
const DELAI = 60_000;

/** Envoie le mail brut au script ; rend false (et le dit dans le journal du serveur) si la copie n'a pas pu être rangée. */
export function rangerDansEnvoyes(brut: Buffer): Promise<boolean> {
  return new Promise((fini) => {
    const script = spawn("python3", ["-I", SCRIPT, "ranger-envoye"], { env: { ...process.env, FICHIER_BOITE_MAIL }, timeout: DELAI });
    script.on("error", () => fini(false));
    script.on("close", (code) => {
      if (code !== 0) console.error(`Boîte mail : copie non rangée dans « Envoyés » (code ${code})`);
      fini(code === 0);
    });
    script.stdin.on("error", () => {});
    script.stdin.end(brut);
  });
}
