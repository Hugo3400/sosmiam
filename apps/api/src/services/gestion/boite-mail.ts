// Inscriptions reçues par mail (ancienne page « Bientôt ») : scripts/recuperer-inscrits.py lit la boîte bonjour@ en IMAP,
// réunit tout dans /root/sos-miam-donnees/inscrits.csv et efface de la base les personnes désinscrites. Le logiciel de
// gestion peut le lancer et montrer les adresses arrivées seulement par mail.
import { execFile } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { lireLigneCsv } from "../../fonctions/texte/lire-ligne-csv.ts";

const executer = promisify(execFile);
const RACINE_DEPOT = join(import.meta.dirname, "..", "..", "..", "..", "..");
const SCRIPT = join(RACINE_DEPOT, "scripts", "recuperer-inscrits.py");
const FICHIER_CONNEXION = process.env.FICHIER_BOITE_MAIL || "/root/sos-miam-secrets/boite-bonjour.env";
const FICHIER_CSV = process.env.FICHIER_INSCRITS_CSV || "/root/sos-miam-donnees/inscrits.csv";

/**
 * La liste complète des inscrits (formulaire et mails, désinscriptions retirées), telle que l'a écrite la dernière
 * synchronisation : c'est elle qui sert à l'envoi de la newsletter. Null si elle n'a jamais été écrite.
 */
export async function lireListeInscrits(): Promise<{ adresse: string; ville: string; telephone: string; beta: string; inscritLe: string }[] | null> {
  let texte: string;
  try {
    texte = (await readFile(FICHIER_CSV, "utf8")).replace(/^\uFEFF/, "");
  } catch {
    return null;
  }
  const [entete, ...lignes] = texte.split(/\r?\n/).filter(Boolean).map((ligne) => lireLigneCsv(ligne));
  const colonne = (nom: string) => entete?.indexOf(nom) ?? -1;
  return lignes
    .map((champs) => ({
      adresse: (champs[colonne("adresse")] ?? "").replace(/^'/, "").trim().toLowerCase(),
      ville: (champs[colonne("ville")] ?? "").replace(/^'/, ""),
      telephone: (champs[colonne("telephone")] ?? "").replace(/^'/, "").toLowerCase(),
      beta: (champs[colonne("beta")] ?? "").replace(/^'/, "").toLowerCase(),
      inscritLe: champs[colonne("inscrit_le")] ?? "",
    }))
    .filter((inscrit) => inscrit.adresse.includes("@"));
}

export async function lireEtatBoite() {
  const boiteConfiguree = await stat(FICHIER_CONNEXION).then(() => true, () => false);
  const inscrits = await lireListeInscrits();
  if (!inscrits) return { boiteConfiguree, derniereSynchro: null, total: 0, parMailSeulement: [] };
  const derniereSynchro = (await stat(FICHIER_CSV)).mtime.toISOString();
  const dansLaBase = new Set(
    (await baseDeDonnees.inscriptionNewsletter.findMany({ where: { email: { in: inscrits.map((i) => i.adresse) } }, select: { email: true } })).map((i) => i.email),
  );
  return {
    boiteConfiguree,
    derniereSynchro,
    total: inscrits.length,
    parMailSeulement: inscrits
      .filter((inscrit) => inscrit.adresse && !dansLaBase.has(inscrit.adresse))
      .slice(0, 300)
      .map(({ adresse, ville, inscritLe }) => ({ adresse, ville, inscritLe })),
  };
}

/** Lance la synchronisation (2 minutes au plus) et rend son compte rendu. */
export async function synchroniserBoite(): Promise<{ ok: boolean; message: string }> {
  try {
    const { stdout } = await executer("python3", [SCRIPT], { cwd: RACINE_DEPOT, timeout: 120_000, maxBuffer: 1024 * 1024 });
    return { ok: true, message: stdout.trim().split("\n").slice(-3).join("\n") || "Synchronisation faite." };
  } catch (erreur) {
    const { stderr, stdout } = erreur as { stderr?: string; stdout?: string };
    return { ok: false, message: (stderr || stdout || String(erreur)).trim().split("\n").slice(-3).join("\n").slice(0, 500) };
  }
}
