// Le ménage que le serveur ne fait pas tout seul (audit du 14 octobre 2026), rappelé dans le logiciel : les mails reçus sur
// bonjour@ de plus de 3 ans (à effacer dans le webmail), les inscrits à relancer (3 ans sans nouvelles : on leur redemande,
// sinon on efface) et les lignes sans date de la liste des désinscrits (gardées par prudence, à dater ou à retirer à la main).
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { FICHIER_BOITE_MAIL } from "../courriels/reglages-envoi.ts";

const executer = promisify(execFile);
const SCRIPT = join(import.meta.dirname, "..", "..", "..", "..", "..", "scripts", "lire-boite-mail.py");
const FICHIER_DESINSCRITS = process.env.FICHIER_DESINSCRITS || "/root/sos-miam-donnees/desinscrits.txt";
const TROIS_ANS_JOURS = 3 * 365;

const SIX_MOIS_JOURS = 183;

async function compterDansLaBoite(commande: string, jours: number, cle: string): Promise<number | null> {
  try {
    const { stdout } = await executer("python3", ["-I", SCRIPT, commande, String(jours)], { timeout: 60_000, env: { ...process.env, FICHIER_BOITE_MAIL } });
    return (JSON.parse(stdout) as Record<string, number>)[cle] ?? null;
  } catch {
    return null;
  }
}

/** GET /maintenance/menage-manuel : ce qui attend un geste de l'équipe (null : la boîte ne répond pas) */
export async function lireMenageManuel(maintenant = new Date()) {
  const limite = new Date(maintenant.getTime() - TROIS_ANS_JOURS * 86_400_000);
  const [mailsAnciens, candidaturesMail, aRelancer, desinscrits] = await Promise.all([
    compterDansLaBoite("compter-anciens", TROIS_ANS_JOURS, "anciens"),
    compterDansLaBoite("compter-candidatures", SIX_MOIS_JOURS, "candidatures"),
    baseDeDonnees.inscriptionNewsletter.count({ where: { derniereInscription: { lt: limite } } }),
    readFile(FICHIER_DESINSCRITS, "utf8").catch(() => ""),
  ]);
  const desinscritsSansDate = desinscrits.split("\n").filter((ligne) => {
    const [adresse, date] = ligne.trim().split(/\s+/);
    return Boolean(adresse) && !/^\d{4}-\d{2}-\d{2}$/.test(date ?? "");
  }).length;
  return { mailsAnciens, candidaturesMail, aRelancer, desinscritsSansDate };
}
