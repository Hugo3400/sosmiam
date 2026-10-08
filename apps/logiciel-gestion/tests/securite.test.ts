// Tests de la clé du poste et des demandes signées (WebCrypto de Node, le même que celui de la fenêtre du logiciel).
import assert from "node:assert/strict";
import { createPublicKey, verify } from "node:crypto";
import { test } from "node:test";

import { calculerEmpreinteSha256 } from "../src/fonctions/securite/calculer-empreinte-sha256.ts";
import { changerMotDePasseCoffre } from "../src/fonctions/securite/changer-mot-de-passe-coffre.ts";
import { construireMessageGestion } from "../src/fonctions/securite/construire-message-gestion.ts";
import { creerClePoste } from "../src/fonctions/securite/creer-cle-poste.ts";
import { decoderBase64Url } from "../src/fonctions/securite/decoder-base64url.ts";
import { encoderBase64Url } from "../src/fonctions/securite/encoder-base64url.ts";
import { ouvrirCoffre } from "../src/fonctions/securite/ouvrir-coffre.ts";
import { signerMessage } from "../src/fonctions/securite/signer-message.ts";

test("le message signé a toujours la même forme (même exemple que l'API)", () => {
  assert.equal(
    construireMessageGestion({ methode: "get", chemin: "/lieux?statut=publie", horodatage: "1791460800000", nonce: "abcdefghijklmnop", session: null, empreinteCorps: "e3b0" }),
    "SOSMIAM-GESTION-1\nGET\n/lieux?statut=publie\n1791460800000\nabcdefghijklmnop\n-\ne3b0",
  );
});

test("base64url et SHA-256 donnent les valeurs attendues", async () => {
  const octets = new Uint8Array([0xfb, 0xff, 0x00, 0x10]);
  assert.equal(encoderBase64Url(octets), "-_8AEA");
  assert.deepEqual([...decoderBase64Url("-_8AEA")], [...octets]);
  assert.equal(await calculerEmpreinteSha256(new Uint8Array()), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
});

test("la clé du poste est gardée chiffrée, s'ouvre avec le bon mot de passe et signe des demandes vérifiables", async () => {
  const { coffre, cleSecrete } = await creerClePoste("une bouée pour les restos");
  assert.equal(coffre.idPoste.length, 16);
  assert.equal(decoderBase64Url(coffre.clePublique).length, 32);
  assert.ok(!JSON.stringify(coffre).includes("bouée"));
  await assert.rejects(() => ouvrirCoffre(coffre, "mauvais mot de passe"));
  // La clé en mémoire signe, mais ne peut pas être exportée
  await assert.rejects(() => crypto.subtle.exportKey("pkcs8", cleSecrete));

  const cleOuverte = await ouvrirCoffre(coffre, "une bouée pour les restos");
  const message = "SOSMIAM-GESTION-1\nGET\n/tableau-de-bord\n1\nnonce\n-\ne3b0";
  const signature = await signerMessage(cleOuverte, message);
  const clePublique = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: coffre.clePublique }, format: "jwk" });
  assert.ok(verify(null, Buffer.from(message), clePublique, decoderBase64Url(signature)));
  assert.ok(!verify(null, Buffer.from(`${message}x`), clePublique, decoderBase64Url(signature)));
});

test("changer de mot de passe garde la même clé", async () => {
  const { coffre } = await creerClePoste("ancien mot de passe");
  const rechiffre = await changerMotDePasseCoffre(coffre, "ancien mot de passe", "nouveau mot de passe");
  assert.equal(rechiffre.clePublique, coffre.clePublique);
  assert.notEqual(rechiffre.chiffre, coffre.chiffre);
  await assert.rejects(() => ouvrirCoffre(rechiffre, "ancien mot de passe"));
  await ouvrirCoffre(rechiffre, "nouveau mot de passe");
  await assert.rejects(() => changerMotDePasseCoffre(coffre, "pas le bon", "peu importe"));
});
