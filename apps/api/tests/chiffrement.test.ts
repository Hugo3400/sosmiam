// Tests du chiffrement des données des comptes (AES-256-GCM, « v1:iv:tag:donnees » en base64url) et de la lecture de
// la clé au démarrage. Clés de TEST seulement, dans un dossier temporaire : la vraie clé n'est jamais lue.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";

import { chiffrerDonnee } from "../src/fonctions/securite/chiffrer-donnee.ts";
import { dechiffrerDonnee } from "../src/fonctions/securite/dechiffrer-donnee.ts";
import { chargerChiffrementDonnees, creerChiffrementDonnees } from "../src/services/chiffrement-donnees.ts";

const cle = randomBytes(32);
const dossier = mkdtempSync(join(tmpdir(), "sos-miam-cle-test-"));
after(() => rmSync(dossier, { recursive: true, force: true }));

test("chiffrer puis déchiffrer rend le texte ; format v1:iv:tag:donnees en base64url, iv neuf à chaque fois", () => {
  const chiffre = chiffrerDonnee("2009-03-14", cle, "dateNaissance");
  assert.match(chiffre, /^v1:[A-Za-z0-9_-]{16}:[A-Za-z0-9_-]{22}:[A-Za-z0-9_-]+$/);
  assert.ok(!chiffre.includes("2009"));
  assert.equal(dechiffrerDonnee(chiffre, cle, "dateNaissance"), "2009-03-14");
  assert.notEqual(chiffrerDonnee("2009-03-14", cle, "dateNaissance"), chiffre, "deux chiffrements du même texte diffèrent");
  assert.equal(dechiffrerDonnee(chiffrerDonnee("Ünïcødé 🍝", cle), cle), "Ünïcødé 🍝");
  assert.equal(dechiffrerDonnee(chiffrerDonnee("", cle), cle), "");
});

test("mauvaise clé, autre contexte, donnée retouchée ou format inconnu : erreur, sans citer la valeur", () => {
  const chiffre = chiffrerDonnee("Martin", cle, "nom");
  assert.throws(() => dechiffrerDonnee(chiffre, randomBytes(32), "nom"));
  assert.throws(() => dechiffrerDonnee(chiffre, cle, "dateNaissance"), Error, "une valeur recopiée dans une autre colonne ne se lit pas");
  const [v, iv, tag, donnees] = chiffre.split(":") as [string, string, string, string];
  const retouchee = [v, iv, tag, `${donnees.slice(0, -1)}${donnees.endsWith("A") ? "B" : "A"}`].join(":");
  assert.throws(() => dechiffrerDonnee(retouchee, cle, "nom"));
  for (const mauvais of ["", "Martin", `v2:${iv}:${tag}:${donnees}`, `v1:${iv}:${tag}`, `v1:${iv}:${tag}:${donnees}:x`, `v1:${iv}=:${tag}:${donnees}`]) {
    assert.throws(() => dechiffrerDonnee(mauvais, cle, "nom"), (erreur: Error) => !erreur.message.includes("Martin"), mauvais);
  }
  assert.throws(() => chiffrerDonnee("x", randomBytes(16)), /32 octets/);
  assert.throws(() => creerChiffrementDonnees(randomBytes(31)), /32 octets/);
});

test("clé lue au démarrage : bon fichier → chiffrement ; absent, mal protégé ou mal écrit → null, message clair sans la clé", () => {
  const messages: string[] = [];
  const erreurOrigine = console.error;
  console.error = (...morceaux: unknown[]) => void messages.push(morceaux.map(String).join(" "));
  try {
    const bonne = join(dossier, "bonne");
    writeFileSync(bonne, `${cle.toString("base64")}\n`, { mode: 0o600 });
    const chiffrement = chargerChiffrementDonnees(bonne);
    assert.ok(chiffrement);
    assert.equal(dechiffrerDonnee(chiffrement.chiffrer("Léa", "nom"), cle, "nom"), "Léa", "la clé du fichier est bien celle utilisée");
    assert.equal(chiffrement.dechiffrer(chiffrerDonnee("Léa", cle, "nom"), "nom"), "Léa");
    assert.equal(messages.length, 0);

    assert.equal(chargerChiffrementDonnees(join(dossier, "absente")), null);
    const ouverte = join(dossier, "ouverte");
    writeFileSync(ouverte, cle.toString("base64"));
    chmodSync(ouverte, 0o644);
    assert.equal(chargerChiffrementDonnees(ouverte), null, "lisible par d'autres comptes : refusée");
    const courte = join(dossier, "courte");
    writeFileSync(courte, randomBytes(16).toString("base64"), { mode: 0o600 });
    assert.equal(chargerChiffrementDonnees(courte), null);
    const texte = join(dossier, "texte");
    writeFileSync(texte, "pas une clé du tout, juste une phrase", { mode: 0o600 });
    assert.equal(chargerChiffrementDonnees(texte), null);

    assert.equal(messages.length, 4);
    for (const message of messages) {
      assert.match(message, /INDISPONIBLE/);
      assert.ok(!message.includes(cle.toString("base64")) && !message.includes(cle.toString("base64url")), "jamais la clé dans le journal");
    }
  } finally {
    console.error = erreurOrigine;
  }
});
