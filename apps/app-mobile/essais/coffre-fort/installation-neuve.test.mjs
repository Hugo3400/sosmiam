import assert from "node:assert/strict";
import { test } from "node:test";

import { lireCodeInvitation } from "~/stockage/code-invitation";
import { lireProfilLocal } from "~/stockage/profil-local";
import { enregistrerJetonSession, lireJetonSession } from "~/stockage/session-compte";
import { lireVerrouAge } from "~/stockage/verrou-age";
import * as D from "./banc/donnees.mjs";

test("première ouverture après une réinstallation (AsyncStorage vide) : session, code et profil d'avant oubliés avant toute lecture", async () => {
  D.remplirCoffre();
  const magasin = D.remplirMagasin();

  const [jeton, profil] = await Promise.all([lireJetonSession(), lireProfilLocal()]);
  assert.equal(jeton, null);
  assert.equal(profil, null);
  assert.deepEqual(D.effacements(), [D.CODE_INVITATION, D.PROFIL, D.SESSION].sort());
  const premiereLecture = globalThis.__journalCoffre.findIndex((e) => e.operation === "lire");
  const dernierEffacement = globalThis.__journalCoffre.findLastIndex((e) => e.operation === "effacer");
  assert.ok(dernierEffacement < premiereLecture, "une lecture est passée avant la fin de l'effacement");
  assert.equal(magasin.get(D.MARQUE), D.MARQUE_A_JOUR);
  assert.equal(magasin.get("sosmiam.invite"), "1", "la visite sans compte reste");
});

test("le verrou d'âge survit à la réinstallation, exprès", async () => {
  assert.equal(await lireVerrouAge(new Date("2026-10-22T12:00:00")), D.VERROU);
});

test("le code d'invitation de la personne d'avant n'est jamais repris : un neuf est tiré et gardé sur cet appareil seulement", async () => {
  const code = await lireCodeInvitation();
  assert.match(code, /^[a-z0-9]{12}$/);
  assert.notEqual(code, D.CODE_D_AVANT);
  assert.deepEqual(globalThis.__coffre.get(D.CODE_INVITATION), { valeur: code, accessible: D.APPAREIL_SEUL });
});

test("une seule vérification par lancement : la connexion qui suit reste, rien n'est effacé une deuxième fois", async () => {
  const avant = D.effacements().length;
  await enregistrerJetonSession(D.JETON_NEUF);
  assert.equal(await lireJetonSession(), D.JETON_NEUF);
  assert.equal(D.effacements().length, avant);
  assert.deepEqual(globalThis.__coffre.get(D.SESSION), { valeur: D.JETON_NEUF, accessible: D.APPAREIL_SEUL });
  assert.equal(globalThis.__journalMagasin.filter((e) => e.cle === D.MARQUE && e.operation === "lire").length, 1);
});
