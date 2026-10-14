// Tests du chiffrement des données des comptes (AES-256-GCM, « v1:iv:tag:donnees » en base64url) et de la lecture de
// la clé au démarrage ; puis du chiffrement de la partie sociale (textes versionnés, fichiers, sous-clés, contextes,
// anciennes versions de clé, 503 sans clé). Clés de TEST seulement, dans un dossier temporaire : la vraie clé n'est jamais lue.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";

import type { Request, Response } from "express";

import { chiffrerDonnee } from "../src/fonctions/securite/chiffrer-donnee.ts";
import { chiffrerOctets } from "../src/fonctions/securite/chiffrer-octets.ts";
import { chiffrerTexteVersionne } from "../src/fonctions/securite/chiffrer-texte-versionne.ts";
import { dechiffrerDonnee } from "../src/fonctions/securite/dechiffrer-donnee.ts";
import { dechiffrerOctets } from "../src/fonctions/securite/dechiffrer-octets.ts";
import { dechiffrerTexteVersionne } from "../src/fonctions/securite/dechiffrer-texte-versionne.ts";
import { exigerChiffrementSocial } from "../src/middlewares/exiger-chiffrement-social.ts";
import { chargerChiffrementDonnees, creerChiffrementDonnees } from "../src/services/chiffrement-donnees.ts";
import { creerChiffrementSocial, SOUS_CLES_SOCIALES } from "../src/services/chiffrement-social.ts";

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
  for (const mauvais of ["", "Martin", `v0:${iv}:${tag}:${donnees}`, `w1:${iv}:${tag}:${donnees}`, `v1:${iv}:${tag}`, `v1:${iv}:${tag}:${donnees}:x`, `v1:${iv}=:${tag}:${donnees}`]) {
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

// --- Partie sociale ---------------------------------------------------------------------------------------------------

/** Change un octet (ou un caractère base64url) à cette place, pour simuler une retouche */
const retoucherOctet = (octets: Buffer, place: number) => {
  const copie = Buffer.from(octets);
  copie[place] = (copie[place] ?? 0) ^ 0x01;
  return copie;
};
const retoucherDernier = (texte: string) => `${texte.slice(0, -1)}${texte.endsWith("A") ? "B" : "A"}`;
const sansValeur = (valeur: string) => (erreur: Error) => !erreur.message.includes(valeur);
const FICHIER = "0b5e8c1a-3f4d-4e2a-9b6c-7d8e9f0a1b2c.bin";
const ID_CLIENT = "8a6f2c3d-1e4b-4f5a-8b7c-9d0e1f2a3b4c";

test("texte versionné : « v<N>:iv:tag:donnees », relu avec la sous-clé de SA version seulement", () => {
  const sousCle = randomBytes(32);
  const chiffre = chiffrerTexteVersionne("On se fait un kebab ?", { version: 3, cle: sousCle }, "conversation:7:message:x");
  assert.match(chiffre, /^v3:[A-Za-z0-9_-]{16}:[A-Za-z0-9_-]{22}:[A-Za-z0-9_-]+$/);
  assert.ok(!chiffre.includes("kebab"));
  const trouver = (version: number) => (version === 3 ? sousCle : null);
  assert.equal(dechiffrerTexteVersionne(chiffre, trouver, "conversation:7:message:x"), "On se fait un kebab ?");
  assert.notEqual(chiffrerTexteVersionne("On se fait un kebab ?", { version: 3, cle: sousCle }, "c"), chiffrerTexteVersionne("On se fait un kebab ?", { version: 3, cle: sousCle }, "c"));
  assert.equal(dechiffrerTexteVersionne(chiffrerTexteVersionne("", { version: 1, cle: sousCle }, "c"), () => sousCle, "c"), "");
  // Contexte faux, version de clé absente, version retouchée, donnée retouchée : erreur, sans citer le texte
  assert.throws(() => dechiffrerTexteVersionne(chiffre, trouver, "conversation:8:message:x"), sansValeur("kebab"));
  assert.throws(() => dechiffrerTexteVersionne(chiffre, () => null, "conversation:7:message:x"), /version 3 absente/);
  assert.throws(() => dechiffrerTexteVersionne(chiffre.replace(/^v3:/, "v2:"), (v) => (v === 2 ? randomBytes(32) : sousCle), "conversation:7:message:x"));
  assert.throws(() => dechiffrerTexteVersionne(retoucherDernier(chiffre), trouver, "conversation:7:message:x"), sansValeur("kebab"));
  for (const mauvais of ["", "kebab", chiffre.replace(/^v3:/, "k3:"), chiffre.replace(/^v3:/, "v0:")]) {
    assert.throws(() => dechiffrerTexteVersionne(mauvais, trouver, "conversation:7:message:x"), sansValeur("kebab"), mauvais);
  }
  assert.throws(() => chiffrerTexteVersionne("x", { version: 1, cle: sousCle }, ""), /contexte/);
  assert.throws(() => dechiffrerTexteVersionne(chiffre, trouver, ""), /contexte/);
  assert.throws(() => chiffrerTexteVersionne("x", { version: 1000, cle: sousCle }, "c"), /Version/);
});

test("octets : « v<N>: » | iv | tag | données ; contexte faux, octet retouché ou format inconnu refusés", () => {
  const sousCle = randomBytes(32);
  const photo = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), randomBytes(2000)]);
  const chiffre = chiffrerOctets(photo, sousCle, 12, `fichier:${FICHIER}`);
  assert.equal(chiffre.subarray(0, 4).toString("latin1"), "v12:");
  assert.equal(chiffre.length, 4 + 12 + 16 + photo.length);
  assert.ok(!chiffre.includes(photo.subarray(0, 64)), "le contenu n'apparaît pas en clair");
  const trouver = (version: number) => (version === 12 ? sousCle : null);
  assert.deepEqual(dechiffrerOctets(chiffre, trouver, `fichier:${FICHIER}`), photo);
  assert.notDeepEqual(chiffrerOctets(photo, sousCle, 12, "c").subarray(4, 16), chiffrerOctets(photo, sousCle, 12, "c").subarray(4, 16), "iv neuf à chaque fois");
  assert.deepEqual(dechiffrerOctets(chiffrerOctets(Buffer.alloc(0), sousCle, 1, "c"), () => sousCle, "c"), Buffer.alloc(0));
  // Un Uint8Array tiré d'un plus grand tampon se lit aussi (décalage respecté)
  const large = Buffer.concat([Buffer.from("xxxxx"), chiffre]);
  assert.deepEqual(dechiffrerOctets(new Uint8Array(large.buffer, large.byteOffset + 5, chiffre.length), trouver, `fichier:${FICHIER}`), photo);

  assert.throws(() => dechiffrerOctets(chiffre, trouver, "fichier:autre.bin"), Error, "un fichier renommé ne se lit plus");
  assert.throws(() => dechiffrerOctets(chiffre, () => randomBytes(32), `fichier:${FICHIER}`));
  assert.throws(() => dechiffrerOctets(chiffre, () => null, `fichier:${FICHIER}`), /version 12 absente/);
  for (const place of [4, 4 + 12, 4 + 28, chiffre.length - 1]) {
    assert.throws(() => dechiffrerOctets(retoucherOctet(chiffre, place), trouver, `fichier:${FICHIER}`), Error, `octet ${place} retouché`);
  }
  const versionChangee = Buffer.concat([Buffer.from("v11:", "latin1"), chiffre.subarray(4)]);
  assert.throws(() => dechiffrerOctets(versionChangee, (v) => (v === 11 ? randomBytes(32) : sousCle), `fichier:${FICHIER}`));
  for (const mauvais of [Buffer.alloc(0), Buffer.from("v12:"), chiffre.subarray(0, 4 + 27), Buffer.concat([Buffer.from("w12:"), chiffre.subarray(4)]), photo]) {
    assert.throws(() => dechiffrerOctets(mauvais, trouver, `fichier:${FICHIER}`), /illisible/);
  }
  assert.throws(() => chiffrerOctets(photo, randomBytes(16), 1, "c"), /32 octets/);
  assert.throws(() => chiffrerOctets(photo, sousCle, 0, "c"), /Version/);
  assert.throws(() => chiffrerOctets(photo, sousCle, 1, ""), /contexte/);
});

test("chiffrement social : sous-clés tirées de la clé des données, chaque contenu dans son contexte", () => {
  assert.equal(creerChiffrementSocial(null), null, "sans clé des données : pas de chiffrement social");
  const donnees = creerChiffrementDonnees(randomBytes(32));
  const social = creerChiffrementSocial(donnees);
  assert.ok(social);
  assert.equal(social.versionCourante, 1);

  const message = social.chiffrerMessage("Rendez-vous à 20 h chez le Capitaine Bouiboui 🍕", 42, ID_CLIENT);
  assert.match(message, /^v1:/);
  assert.equal(social.dechiffrerMessage(message, 42, ID_CLIENT), "Rendez-vous à 20 h chez le Capitaine Bouiboui 🍕");
  assert.equal(dechiffrerDonnee(message, donnees.deriverCle(SOUS_CLES_SOCIALES.textes), `conversation:42:message:${ID_CLIENT}`), "Rendez-vous à 20 h chez le Capitaine Bouiboui 🍕", "sous-clé « textes », contexte d'A.0");
  assert.throws(() => donnees.dechiffrer(message, "nom"), Error, "la clé maître elle-même ne le lit pas");
  // Un chiffré déplacé (autre conversation, autre message, titre, autre usage) ne se lit plus
  assert.throws(() => social.dechiffrerMessage(message, 43, ID_CLIENT), sansValeur("Bouiboui"));
  assert.throws(() => social.dechiffrerMessage(message, 42, "8a6f2c3d-1e4b-4f5a-8b7c-9d0e1f2a3b4d"), sansValeur("Bouiboui"));
  assert.throws(() => social.dechiffrerTitre(message, 42), sansValeur("Bouiboui"));
  assert.throws(() => social.dechiffrerTexte("instantanes", `conversation:42:message:${ID_CLIENT}`, message), sansValeur("Bouiboui"), "autre sous-clé");
  assert.throws(() => social.dechiffrerMessage(retoucherDernier(message), 42, ID_CLIENT), sansValeur("Bouiboui"));

  const titre = social.chiffrerTitre("Les Gloutons 🍔", 42);
  assert.equal(social.dechiffrerTitre(titre, 42), "Les Gloutons 🍔");
  assert.throws(() => social.dechiffrerTitre(titre, 41));
  const code = social.chiffrerCode("ab3k9pqr7xyz", 7);
  assert.equal(social.dechiffrerCode(code, 7), "ab3k9pqr7xyz");
  assert.throws(() => social.dechiffrerCode(code, 8), Error, "le code d'un compte ne vaut pas pour un autre");
  const instantane = social.chiffrerInstantane(JSON.stringify({ type: "texte", texte: "coucou" }), 5);
  assert.deepEqual(JSON.parse(social.dechiffrerInstantane(instantane, 5)), { type: "texte", texte: "coucou" });
  assert.throws(() => social.dechiffrerInstantane(instantane, 6));
  assert.throws(() => social.dechiffrerCode(instantane, 5), Error, "sous-clé de la modération à part");

  const vocal = randomBytes(500);
  const fichier = social.chiffrerOctets(vocal, FICHIER);
  assert.equal(fichier.subarray(0, 3).toString("latin1"), "v1:");
  assert.deepEqual(social.dechiffrerOctets(fichier, FICHIER), vocal);
  assert.deepEqual(dechiffrerOctets(fichier, () => donnees.deriverCle(SOUS_CLES_SOCIALES.medias), `fichier:${FICHIER}`), vocal);
  assert.throws(() => social.dechiffrerOctets(fichier, "1b5e8c1a-3f4d-4e2a-9b6c-7d8e9f0a1b2c.bin"));
  assert.throws(() => social.dechiffrerOctets(retoucherOctet(fichier, fichier.length - 1), FICHIER));

  // Contextes mal formés : refusés avant de chiffrer
  for (const essai of [() => social.chiffrerMessage("x", 0, ID_CLIENT), () => social.chiffrerMessage("x", 1, ""), () => social.chiffrerTitre("x", 1.5), () => social.chiffrerCode("x", -1), () => social.chiffrerOctets(vocal, "")]) {
    assert.throws(essai, /contexte/);
  }
  assert.equal(social.estAncien(message), false);
  assert.equal(social.estAncienOctets(fichier), false);
});

test("chiffrement social pendant un changement de clé : écrit en v2, relit v1, estAncien ; sans l'ancienne clé, erreur", () => {
  const ancienne = randomBytes(32);
  const nouvelle = randomBytes(32);
  const avant = creerChiffrementSocial(creerChiffrementDonnees(ancienne));
  const pendant = creerChiffrementSocial(creerChiffrementDonnees(nouvelle, { version: 2, anciennes: [{ version: 1, cle: ancienne }] }));
  const apres = creerChiffrementSocial(creerChiffrementDonnees(nouvelle, { version: 2 }));
  assert.ok(avant && pendant && apres);

  const ancienMessage = avant.chiffrerMessage("Ça tient toujours, la raclette ?", 3, ID_CLIENT);
  const ancienFichier = avant.chiffrerOctets(Buffer.from("photo"), FICHIER);
  const ancienCode = avant.chiffrerCode("ab3k9pqr7xyz", 9);
  const ancienInstantane = avant.chiffrerInstantane("{}", 4);
  assert.equal(pendant.versionCourante, 2);
  assert.equal(pendant.dechiffrerMessage(ancienMessage, 3, ID_CLIENT), "Ça tient toujours, la raclette ?");
  assert.deepEqual(pendant.dechiffrerOctets(ancienFichier, FICHIER), Buffer.from("photo"));
  assert.equal(pendant.dechiffrerCode(ancienCode, 9), "ab3k9pqr7xyz");
  assert.equal(pendant.dechiffrerInstantane(ancienInstantane, 4), "{}");
  assert.equal(pendant.estAncien(ancienMessage), true);
  assert.equal(pendant.estAncienOctets(ancienFichier), true);

  // Rechiffré par le ménage de nuit : la nouvelle clé seule le lit
  const neuf = pendant.chiffrerMessage(pendant.dechiffrerMessage(ancienMessage, 3, ID_CLIENT), 3, ID_CLIENT);
  const fichierNeuf = pendant.chiffrerOctets(pendant.dechiffrerOctets(ancienFichier, FICHIER), FICHIER);
  assert.match(neuf, /^v2:/);
  assert.equal(fichierNeuf.subarray(0, 3).toString("latin1"), "v2:");
  assert.equal(pendant.estAncien(neuf), false);
  assert.equal(pendant.estAncienOctets(fichierNeuf), false);
  assert.equal(apres.dechiffrerMessage(neuf, 3, ID_CLIENT), "Ça tient toujours, la raclette ?");
  assert.deepEqual(apres.dechiffrerOctets(fichierNeuf, FICHIER), Buffer.from("photo"));
  assert.throws(() => avant.dechiffrerMessage(neuf, 3, ID_CLIENT), sansValeur("raclette"));

  // Ancienne clé retirée : ce qui n'a pas été rechiffré ne se lit plus (sans citer la valeur) ; une version retouchée non plus
  assert.throws(() => apres.dechiffrerMessage(ancienMessage, 3, ID_CLIENT), /version 1 absente/);
  assert.throws(() => apres.dechiffrerOctets(ancienFichier, FICHIER), /version 1 absente/);
  assert.throws(() => pendant.dechiffrerMessage(ancienMessage.replace(/^v1:/, "v2:"), 3, ID_CLIENT), sansValeur("raclette"));
  assert.throws(() => pendant.dechiffrerMessage(neuf.replace(/^v2:/, "v1:"), 3, ID_CLIENT), sansValeur("raclette"));
  assert.throws(() => pendant.dechiffrerMessage(ancienMessage.replace(/^v1:/, "v7:"), 3, ID_CLIENT), /version 7 absente/);
});

test("exigerChiffrementSocial : sans clé, 503 chiffrement-indisponible avant tout ; avec, la suite", () => {
  const appeler = (chiffrement: ReturnType<typeof creerChiffrementSocial>) => {
    const sortie: { statut?: number; corps?: unknown; suite: boolean } = { suite: false };
    const reponse = {
      status(code: number) {
        sortie.statut = code;
        return this;
      },
      json(corps: unknown) {
        sortie.corps = corps;
        return this;
      },
    } as unknown as Response;
    exigerChiffrementSocial(chiffrement)({} as Request, reponse, () => void (sortie.suite = true));
    return sortie;
  };
  assert.deepEqual(appeler(null), { statut: 503, corps: { ok: false, erreur: "chiffrement-indisponible" }, suite: false });
  assert.deepEqual(appeler(creerChiffrementSocial(creerChiffrementDonnees(randomBytes(32)))), { suite: true });
});
