// Les vérifications comptées d'un essai, et sa fin : le bilan (nombre de vérifications, migrations rejouées) affiché, et
// rendu au lanceur quand il l'a lancé (canal IPC de fork).
import assert from "node:assert/strict";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";
import type { BaseEnMemoire } from "./base-en-memoire.ts";

export type BilanEssai = { essai: string; verifications: number; migrations: number };

export function creerVerifications() {
  let nombre = 0;
  return {
    egal(obtenu: unknown, attendu: unknown, message?: string): void {
      assert.deepEqual(obtenu, attendu, message);
      nombre++;
    },
    vrai(valeur: unknown, message?: string): void {
      assert.ok(valeur, message);
      nombre++;
    },
    correspond(texte: string, motif: RegExp, message?: string): void {
      assert.match(texte, motif, message);
      nombre++;
    },
    async rejette(promesse: Promise<unknown>, motif: RegExp, message?: string): Promise<void> {
      await assert.rejects(promesse, motif, message);
      nombre++;
    },
    get nombre(): number {
      return nombre;
    },
  };
}

/** Ferme la base, affiche le bilan et le rend au lanceur ; `adresse` : import.meta.url de l'essai (son nom) */
export async function terminerEssai(adresse: string, essai: BaseEnMemoire, verifications: number): Promise<void> {
  await essai.fermer();
  const bilan: BilanEssai = { essai: basename(fileURLToPath(adresse), ".ts"), verifications, migrations: essai.migrations.length };
  console.log(`${bilan.essai} : ${verifications} vérifications, tout est bon (${bilan.migrations} migrations du dépôt rejouées dans PGlite).`);
  const envoyer = process.send?.bind(process);
  if (envoyer) await new Promise<void>((fini) => envoyer(bilan, () => fini()));
}
