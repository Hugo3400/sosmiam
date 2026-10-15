import { test } from "node:test";
import assert from "node:assert/strict";
import { calculerPointsPhotoAvis } from "../src/fonctions/avis/calculer-points-photo-avis.ts";
import { lireVerdictRelecture } from "../src/fonctions/avis/lire-verdict-relecture.ts";
import { resumerAvis } from "../src/fonctions/avis/resumer-avis.ts";
import { signerAvis } from "../src/fonctions/avis/signer-avis.ts";
import { validerAvisNonVerifie } from "../src/validation/valider-avis-non-verifie.ts";
import type { NouvelAvisNonVerifie } from "../src/types/avis.ts";

test("signature : « Prénom I. » pour qui a donné son nom, prénom seul sinon", () => {
  assert.equal(signerAvis("Léa", "m"), "Léa M.");
  assert.equal(signerAvis("  Jean   Pierre ", "é"), "Jean Pierre É.");
  assert.equal(signerAvis("Inès", "D"), "Inès D.");
  // Sans nom, ou une initiale vide
  assert.equal(signerAvis("Karim", null), "Karim");
  assert.equal(signerAvis("Karim", " "), "Karim");
  assert.equal(signerAvis("   ", "M"), "Quelqu'un M.");
  assert.equal(signerAvis("x".repeat(80), null).length, 40);
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

test("points de la photo d'un avis : 10 pour un avis vérifié avec photo, 0 pour un repas offert, sans photo ou non vérifié", () => {
  assert.equal(calculerPointsPhotoAvis({ verifie: true, avecPhoto: true, repasOffert: false }), 10);
  assert.equal(calculerPointsPhotoAvis({ verifie: true, avecPhoto: true, repasOffert: true }), 0);
  assert.equal(calculerPointsPhotoAvis({ verifie: true, avecPhoto: false, repasOffert: false }), 0);
  assert.equal(calculerPointsPhotoAvis({ verifie: false, avecPhoto: true, repasOffert: false }), 0);
});
