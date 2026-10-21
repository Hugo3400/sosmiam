import assert from "node:assert/strict";
import { test } from "node:test";

import { creerJournalEnvoisMedias } from "../src/services/journal-envois-medias.ts";

const DEBUT = Date.parse("2026-10-21T10:00:00Z");
const HEURE = 3600_000;
const a = (heures: number) => new Date(DEBUT + heures * HEURE);

test("journal des envois : par compte sur 24 h glissantes, le total du serveur aussi", () => {
  const journal = creerJournalEnvoisMedias();
  journal.noter(1, 100, a(0));
  journal.noter(1, 50, a(1));
  journal.noter(2, 7, a(2));
  assert.deepEqual(journal.lire(1, a(3)), { envoisCompte24h: 2, octetsCompte24h: 150, octetsServeur24h: 157 });
  assert.deepEqual(journal.lire(2, a(3)), { envoisCompte24h: 1, octetsCompte24h: 7, octetsServeur24h: 157 });
  assert.deepEqual(journal.lire(3, a(3)), { envoisCompte24h: 0, octetsCompte24h: 0, octetsServeur24h: 157 });
  assert.deepEqual(journal.lire(1, a(24)), { envoisCompte24h: 2, octetsCompte24h: 150, octetsServeur24h: 157 }, "24 h pile : encore compté");
  assert.deepEqual(journal.lire(1, a(24.5)), { envoisCompte24h: 1, octetsCompte24h: 50, octetsServeur24h: 57 });
  assert.deepEqual(journal.lire(1, a(26)), { envoisCompte24h: 0, octetsCompte24h: 0, octetsServeur24h: 7 });
  assert.deepEqual(journal.lire(2, a(27)), { envoisCompte24h: 0, octetsCompte24h: 0, octetsServeur24h: 0 });
});

test("journal des envois : borné en mémoire, les plus anciens partent d'abord", () => {
  const journal = creerJournalEnvoisMedias(3000);
  for (let i = 0; i < 5000; i++) journal.noter(i % 2, 1, a(i / 1000));
  assert.deepEqual(journal.lire(0, a(5)), { envoisCompte24h: 1500, octetsCompte24h: 1500, octetsServeur24h: 3000 });
  assert.deepEqual(journal.lire(1, a(5)), { envoisCompte24h: 1500, octetsCompte24h: 1500, octetsServeur24h: 3000 });
  journal.noter(9, 4, a(5));
  assert.deepEqual(journal.lire(9, a(5)), { envoisCompte24h: 1, octetsCompte24h: 4, octetsServeur24h: 3003 });
});
