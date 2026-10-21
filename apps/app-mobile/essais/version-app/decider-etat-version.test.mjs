import assert from "node:assert/strict";
import { test } from "node:test";

import { deciderEtatVersion } from "~/fonctions/version/decider-etat-version";

const A_JOUR = { etat: "a-jour" };
const OBLIGATOIRE = { etat: "obligatoire" };
const nouvelle = (version) => ({ etat: "nouvelle-version", version });
const versions = (ios, android) => ({ ios, android });

const decider = (installee, plateforme, minimale, derniere) => deciderEtatVersion({ installee, plateforme, minimale, derniere });

test("aujourd'hui : minimale à 0.0.0 et pas de derniere, rien à demander", () => {
  assert.deepEqual(decider("1.0.0", "ios", versions("0.0.0", "0.0.0"), undefined), A_JOUR);
  assert.deepEqual(decider("1.0.0", "android", versions("0.0.0", "0.0.0"), undefined), A_JOUR);
});

test("versions égales : à jour", () => {
  assert.deepEqual(decider("1.2.0", "ios", versions("1.2.0", "1.2.0"), versions("1.2.0", "1.2.0")), A_JOUR);
});

test("une version plus récente existe : nouvelle version, avec le numéro proposé", () => {
  assert.deepEqual(decider("1.0.0", "ios", versions("0.0.0", "0.0.0"), versions("1.1.0", "1.0.0")), nouvelle("1.1.0"));
  assert.deepEqual(decider("1.0.0", "android", versions("0.0.0", "0.0.0"), versions("1.0.0", " 1.0.3 ")), nouvelle("1.0.3"));
});

test("chaque système lit sa propre ligne", () => {
  const minimale = versions("2.0.0", "0.0.0");
  const derniere = versions("2.0.0", "1.5.0");
  assert.deepEqual(decider("1.0.0", "ios", minimale, derniere), OBLIGATOIRE);
  assert.deepEqual(decider("1.0.0", "android", minimale, derniere), nouvelle("1.5.0"));
});

test("l'app est plus récente que la derniere annoncée : à jour", () => {
  assert.deepEqual(decider("1.3.0", "ios", versions("1.0.0", "1.0.0"), versions("1.2.9", "1.2.9")), A_JOUR);
});

test("minimale au-dessus de la version de l'app : obligatoire, même avec une derniere", () => {
  assert.deepEqual(decider("1.0.0", "ios", versions("1.0.1", "1.0.1"), undefined), OBLIGATOIRE);
  assert.deepEqual(decider("1.0.0", "android", versions("1.0.1", "1.0.1"), versions("1.2.0", "1.2.0")), OBLIGATOIRE);
  assert.deepEqual(decider("1.9", "ios", versions("1.10.0", "0.0.0"), undefined), OBLIGATOIRE);
});

test("minimale égale à la version de l'app : pas de blocage", () => {
  assert.deepEqual(decider("1.0.1", "ios", versions("1.0.1", "1.0.1"), undefined), A_JOUR);
});

test("parties manquantes : 1.2 vaut 1.2.0", () => {
  assert.deepEqual(decider("1.2", "ios", versions("1.2.0", "1.2.0"), versions("1.2", "1.2")), A_JOUR);
  assert.deepEqual(decider("1.2.0", "ios", versions("1.2", "1.2"), versions("1.3", "1.3")), nouvelle("1.3"));
  assert.deepEqual(decider("1", "android", versions("1.0.1", "1.0.1"), undefined), OBLIGATOIRE);
});

test("derniere absente ou mal écrite : pas de fenêtre douce", () => {
  const minimale = versions("0.0.0", "0.0.0");
  for (const derniere of [undefined, null, "1.2.0", 12, [], [{ ios: "2.0.0" }], {}, versions("abc", "abc"), versions(null, null), versions(2, 2), { ios: "2.0.0" }, versions("2.0.0.1", "v2")]) {
    assert.deepEqual(decider("1.0.0", "android", minimale, derniere), A_JOUR, JSON.stringify(derniere) ?? String(derniere));
  }
  assert.deepEqual(decider("1.0.0", "ios", minimale, { android: "2.0.0" }), A_JOUR);
});

test("minimale mal écrite : compte comme 0.0.0, jamais de blocage", () => {
  for (const minimale of [undefined, null, "9.9.9", {}, versions("abc", "abc"), versions("9.9.9.9", "v9"), versions(9, 9)]) {
    assert.deepEqual(decider("1.0.0", "ios", minimale, undefined), A_JOUR, JSON.stringify(minimale) ?? String(minimale));
  }
  assert.deepEqual(decider("1.0.0", "ios", versions("abc", "abc"), versions("1.1.0", "1.1.0")), nouvelle("1.1.0"));
});

test("plateforme web ou inconnue : rien du tout", () => {
  for (const plateforme of ["web", "windows", "macos", null, undefined, "IOS"]) {
    assert.deepEqual(decider("1.0.0", plateforme, versions("9.0.0", "9.0.0"), versions("9.1.0", "9.1.0")), A_JOUR, String(plateforme));
  }
});

test("version de l'app illisible : on ne bloque personne", () => {
  for (const installee of [undefined, null, "", "dev", "1.0.0-beta"]) {
    assert.deepEqual(decider(installee, "ios", versions("9.0.0", "9.0.0"), versions("9.1.0", "9.1.0")), A_JOUR, String(installee));
  }
});

test("une clé héritée n'est pas une version", () => {
  const minimale = Object.create({ ios: "9.0.0" });
  assert.deepEqual(decider("1.0.0", "ios", minimale, undefined), A_JOUR);
});
