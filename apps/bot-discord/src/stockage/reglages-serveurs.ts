// Réglages de chaque serveur Discord (salons choisis avec /config), gardés dans donnees/reglages.json.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export type ReglagesServeur = {
  salonBienvenue?: string;
  salonPropositions?: string;
};

const fichier = join(import.meta.dirname, "..", "..", "donnees", "reglages.json");
const reglages: Record<string, ReglagesServeur> = lireFichier();

function lireFichier(): Record<string, ReglagesServeur> {
  try {
    return JSON.parse(readFileSync(fichier, "utf8"));
  } catch (erreur) {
    // Pas encore de fichier : on part de zéro. Un fichier abîmé, lui, arrête le bot plutôt que d'être écrasé.
    if ((erreur as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw erreur;
  }
}

export function lireReglages(idServeur: string): ReglagesServeur {
  return reglages[idServeur] ?? {};
}

/** Une valeur `undefined` efface le réglage. Écriture dans un fichier temporaire puis renommage, pour ne jamais laisser un fichier à moitié écrit. */
export function modifierReglages(idServeur: string, changements: Partial<ReglagesServeur>): void {
  const nouveaux = { ...lireReglages(idServeur), ...changements };
  for (const cle of Object.keys(nouveaux) as (keyof ReglagesServeur)[]) {
    if (nouveaux[cle] === undefined) delete nouveaux[cle];
  }
  reglages[idServeur] = nouveaux;
  mkdirSync(dirname(fichier), { recursive: true });
  writeFileSync(`${fichier}.tmp`, JSON.stringify(reglages, null, 2));
  renameSync(`${fichier}.tmp`, fichier);
}
