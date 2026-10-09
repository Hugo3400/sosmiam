import { test } from "node:test";
import assert from "node:assert/strict";
import { lireVerdictRelecture } from "../src/fonctions/avis/lire-verdict-relecture.ts";
import { resumerAvis } from "../src/fonctions/avis/resumer-avis.ts";
import { signerAvis } from "../src/fonctions/avis/signer-avis.ts";
import { validerAvisNonVerifie } from "../src/validation/valider-avis-non-verifie.ts";
import type { NouvelAvisNonVerifie } from "../src/types/avis.ts";

test("signature : « Prénom I. » pour un adulte qui a donné son nom, prénom seul sinon", () => {
  assert.equal(signerAvis("Léa", "m", true), "Léa M.");
  assert.equal(signerAvis("  Jean   Pierre ", "é", true), "Jean Pierre É.");
  // 15-17 ans : jamais l'initiale, même avec un nom
  assert.equal(signerAvis("Inès", "D", false), "Inès");
  // Sans nom, ou une initiale vide
  assert.equal(signerAvis("Karim", null, true), "Karim");
  assert.equal(signerAvis("Karim", " ", true), "Karim");
  assert.equal(signerAvis("   ", "M", true), "Quelqu'un M.");
  assert.equal(signerAvis("x".repeat(80), null, true).length, 40);
});

const AVIS: NouvelAvisNonVerifie = { lieuId: 12, note: 4, texte: "Crêpes dorées, cidre frais, accueil adorable.", photo: null };

test("avis non vérifié : un lieu, puis le même contenu qu'un avis vérifié", () => {
  assert.equal(validerAvisNonVerifie(AVIS), null);
  assert.equal(validerAvisNonVerifie({ ...AVIS, photo: "photo-3.jpg" }), null);
  for (const lieuId of [0, -1, 1.5, "12", null]) {
    assert.equal(validerAvisNonVerifie({ ...AVIS, lieuId } as unknown as NouvelAvisNonVerifie), "avis-invalide", String(lieuId));
  }
  for (const reste of [{ note: 0 }, { note: 6 }, { texte: "Bof." }, { texte: "x".repeat(1001) }, { photo: 3 }, { texte: "Le patron est un connard." }]) {
    assert.equal(validerAvisNonVerifie({ ...AVIS, ...reste } as unknown as NouvelAvisNonVerifie), "avis-invalide", JSON.stringify(reste));
  }
});

test("verdict de relecture : liste fermée, jamais de texte libre", () => {
  assert.deepEqual(lireVerdictRelecture({ type: "ok" }), { type: "ok" });
  assert.deepEqual(lireVerdictRelecture({ type: "deporte", motif: "attaque" }), { type: "deporte" });
  assert.deepEqual(lireVerdictRelecture({ type: "louche", motif: "faux-avis", texte: "bla" }), { type: "louche", motif: "faux-avis" });
  for (const brut of [null, "ok", [], {}, { type: "louche" }, { type: "louche", motif: "toString" }, { type: "louche", motif: "pas sympa" }, { type: "masquer" }]) {
    assert.equal(lireVerdictRelecture(brut), null, JSON.stringify(brut));
  }
});

test("résumé des avis : moyenne prudente au dixième, nombre, part de retour au centième dès 20 clients", () => {
  assert.deepEqual(resumerAvis([], []), { moyenne: null, nombre: 0, partRetour: null });
  // (5 × 4 + 5) / 6 = 4,1666…
  assert.deepEqual(resumerAvis([5], []), { moyenne: 4.2, nombre: 1, partRetour: null });
  const clients = Array.from({ length: 30 }, (_, i) => ({ client: `c${i}`, jour: "2026-10-01" }));
  const retours = Array.from({ length: 7 }, (_, i) => ({ client: `c${i}`, jour: "2026-10-04" }));
  // 7 sur 30 = 0,2333…
  assert.deepEqual(resumerAvis([1, 1], [...clients, ...retours]), { moyenne: 3.1, nombre: 2, partRetour: 0.23 });
});
