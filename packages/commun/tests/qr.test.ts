import { test } from "node:test";
import assert from "node:assert/strict";
import type { JetonComptoir, VersionJetonComptoir } from "../src/types/code-scanne.ts";
import { calculerDelaiChangementQr } from "../src/fonctions/qr/calculer-delai-changement-qr.ts";
import { calculerFenetreQr } from "../src/fonctions/qr/calculer-fenetre-qr.ts";
import { comparerEnTempsConstant } from "../src/fonctions/qr/comparer-en-temps-constant.ts";
import { construireLienLieu } from "../src/fonctions/qr/construire-lien-lieu.ts";
import { construireMessageQr } from "../src/fonctions/qr/construire-message-qr.ts";
import { construireTexteComptoir } from "../src/fonctions/qr/construire-texte-comptoir.ts";
import { lireCodeScanne } from "../src/fonctions/qr/lire-code-scanne.ts";
import { verifierJetonComptoir } from "../src/fonctions/qr/verifier-jeton-comptoir.ts";

const MAINTENANT = Date.parse("2026-10-09T19:30:10.000Z");
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/** Signature factice pour les tests (pas une sécurité) : 11 caractères en démo, 22 pour l'API */
function signer(message: string, longueur: number): string {
  let h = 2_166_136_261;
  let sortie = "";
  for (let i = 0; i < longueur; i++) {
    for (const caractere of `${message}#${i}`) h = Math.imul(h ^ caractere.charCodeAt(0), 16_777_619) >>> 0;
    sortie += ALPHABET[h % 64];
  }
  return sortie;
}
const signerDemo = (message: string) => signer(message, 11);
const signerApi = async (message: string) => signer(message, 22);

function creerJeton(fenetre: number, version: VersionJetonComptoir = "d", lieuId = 0, presentationId = 42): JetonComptoir {
  const sansMac = { version, lieuId, presentationId, fenetre };
  return { ...sansMac, mac: signer(construireMessageQr(sansMac), version === "d" ? 11 : 22) };
}

test("calculerFenetreQr et calculerDelaiChangementQr : fenêtres de 30 s", () => {
  const debut = calculerFenetreQr(MAINTENANT) * 30_000;
  assert.equal(calculerFenetreQr(debut), calculerFenetreQr(debut + 29_999));
  assert.equal(calculerFenetreQr(debut + 30_000), calculerFenetreQr(debut) + 1);
  assert.equal(calculerDelaiChangementQr(debut), 30_000);
  assert.equal(calculerDelaiChangementQr(debut + 10_000), 20_000);
  assert.equal(calculerDelaiChangementQr(debut + 29_999), 1);
});

test("construireMessageQr", () => {
  assert.equal(construireMessageQr({ version: "1", lieuId: 13, presentationId: 7, fenetre: 59_000_000 }), "comptoir|1|13|7|59000000");
});

test("fenêtre en cours et fenêtre précédente : acceptées", async () => {
  const enCours = calculerFenetreQr(MAINTENANT);
  const o = { maintenantMs: MAINTENANT, calculerMac: signerDemo };
  assert.deepEqual(await verifierJetonComptoir(creerJeton(enCours), o), { ok: true });
  assert.deepEqual(await verifierJetonComptoir(creerJeton(enCours - 1), o), { ok: true });
});

test("fenêtre −2 : qr-expire ; fenêtre +1 : qr-invalide", async () => {
  const enCours = calculerFenetreQr(MAINTENANT);
  const o = { maintenantMs: MAINTENANT, calculerMac: signerDemo };
  assert.deepEqual(await verifierJetonComptoir(creerJeton(enCours - 2), o), { ok: false, erreur: "qr-expire" });
  assert.deepEqual(await verifierJetonComptoir(creerJeton(enCours + 1), o), { ok: false, erreur: "qr-invalide" });
});

test("signature asynchrone (API) acceptée", async () => {
  const jeton = creerJeton(calculerFenetreQr(MAINTENANT), "1", 13, 9_999);
  assert.deepEqual(await verifierJetonComptoir(jeton, { maintenantMs: MAINTENANT, calculerMac: signerApi }), { ok: true });
});

test("MAC dont un caractère a changé : qr-invalide", async () => {
  const jeton = creerJeton(calculerFenetreQr(MAINTENANT));
  const dernier = jeton.mac.at(-1) === "A" ? "B" : "A";
  const falsifie = { ...jeton, mac: jeton.mac.slice(0, -1) + dernier };
  const o = { maintenantMs: MAINTENANT, calculerMac: signerDemo };
  assert.deepEqual(await verifierJetonComptoir(falsifie, o), { ok: false, erreur: "qr-invalide" });
  assert.deepEqual(await verifierJetonComptoir({ ...jeton, presentationId: 43 }, o), { ok: false, erreur: "qr-invalide" });
  assert.deepEqual(await verifierJetonComptoir({ ...jeton, lieuId: 1 }, o), { ok: false, erreur: "qr-invalide" });
});

test("construireTexteComptoir puis lireCodeScanne rend le même jeton", () => {
  for (const jeton of [creerJeton(calculerFenetreQr(MAINTENANT)), creerJeton(59_678_123, "1", 2_000_000, 3_000_000_000)]) {
    const texte = construireTexteComptoir(jeton);
    assert.match(texte, /^https:\/\/sosmiam\.fr\/v\//);
    assert.deepEqual(lireCodeScanne(texte), { type: "comptoir", jeton });
  }
});

test("lireCodeScanne : variantes d'écriture acceptées pour le comptoir", () => {
  const jeton = creerJeton(calculerFenetreQr(MAINTENANT));
  const chemin = construireTexteComptoir(jeton).replace("https://sosmiam.fr", "");
  for (const debut of ["https://sosmiam.fr", "http://sosmiam.fr", "https://www.sosmiam.fr", "sosmiam.fr", "www.sosmiam.fr"]) {
    assert.deepEqual(lireCodeScanne(`  ${debut}${chemin}/\n`), { type: "comptoir", jeton });
  }
});

test("lireCodeScanne : longueur de la signature selon la version", () => {
  const demo = creerJeton(calculerFenetreQr(MAINTENANT));
  const api = creerJeton(calculerFenetreQr(MAINTENANT), "1");
  assert.equal(lireCodeScanne(construireTexteComptoir({ ...demo, version: "1" })).type, "autre");
  assert.equal(lireCodeScanne(construireTexteComptoir({ ...api, version: "d" })).type, "autre");
  assert.equal(lireCodeScanne(construireTexteComptoir({ ...demo, version: "2" as VersionJetonComptoir })).type, "autre");
});

test("sosmiam.fr.exemple.com/v/… et autres hôtes : autre", () => {
  const chemin = construireTexteComptoir(creerJeton(calculerFenetreQr(MAINTENANT))).replace("https://sosmiam.fr", "");
  for (const debut of ["sosmiam.fr.exemple.com", "https://sosmiam.fr.exemple.com", "https://faux-sosmiam.fr", "https://sosmiam.fr@exemple.com", "ftp://sosmiam.fr", "https://pro.sosmiam.fr"]) {
    assert.deepEqual(lireCodeScanne(`${debut}${chemin}`), { type: "autre" });
  }
  assert.deepEqual(lireCodeScanne(`https://sosmiam.fr${chemin}?x=1`), { type: "autre" });
});

test("QR de vitrine reconnu", () => {
  assert.equal(construireLienLieu("nonnalia"), "https://sosmiam.fr/l/nonnalia");
  assert.deepEqual(lireCodeScanne(construireLienLieu("nonnalia")), { type: "lieu", codePublic: "nonnalia" });
  assert.deepEqual(lireCodeScanne("www.sosmiam.fr/l/k7mq2x9p/?source=vitrine"), { type: "lieu", codePublic: "k7mq2x9p" });
  assert.deepEqual(lireCodeScanne("http://sosmiam.fr/l/k7mq2x9p#haut"), { type: "lieu", codePublic: "k7mq2x9p" });
  for (const faux of ["https://sosmiam.fr/l/nonnali", "https://sosmiam.fr/l/nonnalia1", "https://sosmiam.fr/l/NONNALIA", "https://sosmiam.fr/l/nonnal10"]) {
    assert.deepEqual(lireCodeScanne(faux), { type: "autre" });
  }
});

test("lien d'invitation et textes quelconques : autre", () => {
  assert.deepEqual(lireCodeScanne("https://sosmiam.fr/invitation/lea.croque?c=k7mq2x9pa4vt"), { type: "autre" });
  assert.deepEqual(lireCodeScanne("sosmiam.fr/invitation/lea.croque"), { type: "autre" });
  assert.deepEqual(lireCodeScanne(""), { type: "autre" });
  assert.deepEqual(lireCodeScanne("Bonjour !"), { type: "autre" });
  assert.deepEqual(lireCodeScanne(`https://sosmiam.fr/l/nonnalia?${"x".repeat(200)}`), { type: "autre" });
});

test("construireTexteComptoir refuse un nombre négatif ou non entier", () => {
  assert.throws(() => construireTexteComptoir({ ...creerJeton(10), lieuId: -1 }));
  assert.throws(() => construireTexteComptoir({ ...creerJeton(10), fenetre: 1.5 }));
});

test("comparerEnTempsConstant", () => {
  assert.equal(comparerEnTempsConstant("abcDEF_-", "abcDEF_-"), true);
  assert.equal(comparerEnTempsConstant("", ""), true);
  assert.equal(comparerEnTempsConstant("abcDEF_-", "abcDEF_+"), false);
  assert.equal(comparerEnTempsConstant("abc", "abcd"), false);
  assert.equal(comparerEnTempsConstant("abcd", "abc"), false);
  assert.equal(comparerEnTempsConstant("", "a"), false);
});
