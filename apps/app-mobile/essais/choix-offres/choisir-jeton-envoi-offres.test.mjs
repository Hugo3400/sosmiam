import assert from "node:assert/strict";
import { test } from "node:test";

import { choisirJetonEnvoiOffres } from "~/fonctions/notifications/choisir-jeton-envoi-offres";
import { classerEnvoiOffres } from "~/fonctions/notifications/classer-envoi-offres";

const NATIF = { ok: true, jeton: "natif-0123456789abcdefghij", plateforme: "android" };
const REFUSE = { ok: false, raison: "refusee" };

test("le jeton natif passe toujours en premier", () => {
  assert.deepEqual(choisirJetonEnvoiOffres(NATIF, true, "garde", "ios"), { jeton: NATIF.jeton, plateforme: "android" });
  assert.deepEqual(choisirJetonEnvoiOffres(NATIF, false, "garde", "ios"), { jeton: NATIF.jeton, plateforme: "android" });
});

test("sans jeton natif : le jeton gardé, seulement pour retirer l'accord", () => {
  assert.deepEqual(choisirJetonEnvoiOffres(REFUSE, false, "garde", "ios"), { jeton: "garde", plateforme: "ios" });
  assert.equal(choisirJetonEnvoiOffres(REFUSE, true, "garde", "ios"), null);
});

test("sans jeton du tout, ou hors téléphone : rien", () => {
  assert.equal(choisirJetonEnvoiOffres(REFUSE, false, null, "ios"), null);
  assert.equal(choisirJetonEnvoiOffres(REFUSE, false, "", "android"), null);
  assert.equal(choisirJetonEnvoiOffres(REFUSE, false, "garde", "web"), null);
});

test("réponses du serveur : partie, à renvoyer, ou sans suite", () => {
  assert.equal(classerEnvoiOffres({ ok: true }), "parti");
  for (const erreur of ["hors-ligne", "erreur-serveur", "trop-de-demandes", "service-indisponible"]) {
    assert.equal(classerEnvoiOffres({ ok: false, erreur }), "a-renvoyer");
  }
  for (const erreur of ["champ-invalide", "connexion-requise", "session-expiree"]) {
    assert.equal(classerEnvoiOffres({ ok: false, erreur }), "sans-suite");
  }
});
