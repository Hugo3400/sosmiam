// Tests de la vérification des jetons d'Apple et de Google, sans réseau : découpage, signature RS256, règles (émetteur,
// audience, exp et iat à 60 s près, nonce, e-mail vérifié), cache des clés publiques (Cache-Control, kid inconnu, panne).
// Clés RSA générées ici (tests/outils/creer-faux-fournisseur.ts), jamais celles d'Apple ou de Google.
import assert from "node:assert/strict";
import { test } from "node:test";

import { lireIdentiteExterne, type ReglesJetonExterne } from "../src/fonctions/comptes/lire-identite-externe.ts";
import { calculerEmpreinteNonce } from "../src/fonctions/securite/calculer-empreinte-nonce.ts";
import { decoderJwt } from "../src/fonctions/securite/decoder-jwt.ts";
import { verifierSignatureRs256 } from "../src/fonctions/securite/verifier-signature-rs256.ts";
import { lireListeVirgules } from "../src/fonctions/texte/lire-liste-virgules.ts";
import { ClesIndisponibles, creerCacheCles } from "../src/services/cles-jwks.ts";
import { creerVerificateurApple, creerVerificateurGoogle } from "../src/services/connexion-externe.ts";
import { creerCleTest, creerFauxFournisseur, signerJeton } from "./outils/creer-faux-fournisseur.ts";

const MAINTENANT = Date.parse("2026-10-09T10:00:00Z");
const SECONDES = MAINTENANT / 1000;
const cle = creerCleTest("cle-1");
const autre = creerCleTest("cle-1");
const NONCE = "un-nonce-tout-frais-123";
const REGLES_APPLE: ReglesJetonExterne = {
  fournisseur: "apple", emetteurs: ["https://appleid.apple.com"], audiences: ["fr.sosmiam.app"], nonce: { valeur: NONCE, forme: "empreinte" },
  exigerEmailVerifie: false,
};
const chargeApple = (retouches: Record<string, unknown> = {}) => ({
  iss: "https://appleid.apple.com", aud: "fr.sosmiam.app", sub: "001234.abcd", iat: SECONDES, exp: SECONDES + 600,
  nonce: calculerEmpreinteNonce(NONCE), email: "Zoe@PrivateRelay.AppleID.com", email_verified: "true", ...retouches,
});
const lire = (jeton: string, regles = REGLES_APPLE, jwk: typeof cle.jwk | null = cle.jwk) => {
  const jwt = decoderJwt(jeton);
  assert.ok(jwt);
  return lireIdentiteExterne(jwt, jwk, regles, MAINTENANT);
};
const raison = (resultat: ReturnType<typeof lire>) => (resultat.ok ? "ok" : resultat.raison);

test("decoderJwt : trois parties base64url, en-tête et charge en objets JSON ; sinon null", () => {
  assert.ok(decoderJwt(signerJeton({ sub: "x" }, cle)));
  for (const mauvais of [undefined, 3, "", "a.b", "a.b.c.d", "é.b.c", `${"a".repeat(9000)}.b.c`, "bnVsbA.e30.c2ln", "e30.WzFd.c2ln"]) {
    assert.equal(decoderJwt(mauvais), null, String(mauvais).slice(0, 20));
  }
});

test("verifierSignatureRs256 : la bonne clé seulement, RSA de 2 048 bits au moins, RS256 et « sig »", () => {
  const jwt = decoderJwt(signerJeton({ sub: "x" }, cle));
  assert.ok(jwt);
  assert.equal(verifierSignatureRs256(jwt.contenuSigne, jwt.signature, cle.jwk), true);
  assert.equal(verifierSignatureRs256(jwt.contenuSigne, jwt.signature, autre.jwk), false);
  assert.equal(verifierSignatureRs256(`${jwt.contenuSigne}x`, jwt.signature, cle.jwk), false);
  assert.equal(verifierSignatureRs256(jwt.contenuSigne, jwt.signature, { ...cle.jwk, alg: "RS512" }), false);
  assert.equal(verifierSignatureRs256(jwt.contenuSigne, jwt.signature, { ...cle.jwk, use: "enc" }), false);
  assert.equal(verifierSignatureRs256(jwt.contenuSigne, jwt.signature, { kty: "EC" }), false);
  const petite = creerCleTest("petite", 1024);
  const faible = decoderJwt(signerJeton({ sub: "x" }, petite));
  assert.ok(faible);
  assert.equal(verifierSignatureRs256(faible.contenuSigne, faible.signature, petite.jwk), false, "1 024 bits : refusée");
});

test("Apple : identité gardée (sub, e-mail « privaterelay » en minuscules, toujours vérifié)", () => {
  const resultat = lire(signerJeton(chargeApple(), cle));
  assert.deepEqual(resultat, {
    ok: true, identite: { fournisseur: "apple", sub: "001234.abcd", email: "zoe@privaterelay.appleid.com", emailVerifie: true, prenom: null, nom: null },
  });
  assert.equal(raison(lire(signerJeton(chargeApple({ email_verified: false }), cle))), "ok", "Apple compte toujours comme vérifié");
  assert.equal(raison(lire(signerJeton(chargeApple({ aud: ["autre", "fr.sosmiam.app"] }), cle))), "ok", "aud en liste");
});

test("refus : algorithme, clé, signature, émetteur, audience, exp et iat à 60 s près, nonce, sub", () => {
  const cas: [string, string, typeof cle.jwk | null][] = [
    ["algorithme", signerJeton(chargeApple(), cle, { alg: "none" }), cle.jwk],
    ["algorithme", signerJeton(chargeApple(), cle, { alg: "HS256" }), cle.jwk],
    ["cle", signerJeton(chargeApple(), cle), null],
    ["signature", signerJeton(chargeApple(), autre), cle.jwk],
    ["emetteur", signerJeton(chargeApple({ iss: "https://accounts.google.com" }), cle), cle.jwk],
    ["audience", signerJeton(chargeApple({ aud: "host.exp.Exponent" }), cle), cle.jwk],
    ["expire", signerJeton(chargeApple({ exp: SECONDES - 60 }), cle), cle.jwk],
    ["expire", signerJeton(chargeApple({ exp: undefined }), cle), cle.jwk],
    ["emis-dans-le-futur", signerJeton(chargeApple({ iat: SECONDES + 61 }), cle), cle.jwk],
    ["nonce", signerJeton(chargeApple({ nonce: NONCE }), cle), cle.jwk],
    ["nonce", signerJeton(chargeApple({ nonce: undefined }), cle), cle.jwk],
    ["sub", signerJeton(chargeApple({ sub: "" }), cle), cle.jwk],
    ["sub", signerJeton(chargeApple({ sub: "x".repeat(256) }), cle), cle.jwk],
  ];
  for (const [attendue, jeton, jwk] of cas) assert.equal(raison(lire(jeton, REGLES_APPLE, jwk)), attendue, attendue);
  // Tolérance d'horloge : expiré depuis 59 s, émis dans 59 s : accepté
  assert.equal(raison(lire(signerJeton(chargeApple({ exp: SECONDES - 59, iat: SECONDES + 59 }), cle))), "ok");
});

test("Google : deux émetteurs, nonce brut s'il est demandé, email_verified exigé, prénom et nom pour pré-remplir", () => {
  const regles: ReglesJetonExterne = {
    fournisseur: "google", emetteurs: ["accounts.google.com", "https://accounts.google.com"], audiences: ["web.apps.googleusercontent.com"],
    nonce: null, exigerEmailVerifie: true,
  };
  const charge = {
    iss: "accounts.google.com", aud: "web.apps.googleusercontent.com", sub: "1098", iat: SECONDES, exp: SECONDES + 3600, email: "zoe@gmail.com",
    email_verified: true, given_name: "Zoé", family_name: "Martin",
  };
  assert.deepEqual(lire(signerJeton(charge, cle), regles), {
    ok: true, identite: { fournisseur: "google", sub: "1098", email: "zoe@gmail.com", emailVerifie: true, prenom: "Zoé", nom: "Martin" },
  });
  assert.equal(raison(lire(signerJeton({ ...charge, email_verified: false }, cle), regles)), "email-non-verifie");
  assert.equal(raison(lire(signerJeton({ ...charge, email: undefined }, cle), regles)), "email-non-verifie");
  const avecNonce = { ...regles, nonce: { valeur: NONCE, forme: "brut" as const } };
  assert.equal(raison(lire(signerJeton({ ...charge, nonce: NONCE }, cle), avecNonce)), "ok");
  assert.equal(raison(lire(signerJeton({ ...charge, nonce: calculerEmpreinteNonce(NONCE) }, cle), avecNonce)), "nonce");
});

test("cache des clés : Cache-Control respecté (1 h sans indication), kid inconnu rechargé une fois par minute au plus", async () => {
  let horloge = MAINTENANT;
  const faux = creerFauxFournisseur("apple", () => horloge);
  const cache = creerCacheCles({ adresse: "https://exemple.invalid/cles", chercher: faux.chercher, horloge: () => horloge });
  faux.etat.cacheControl = "public, max-age=120";
  // Trois demandes en même temps : un seul chargement
  const cles = await Promise.all([cache.trouverCle("apple-1"), cache.trouverCle("apple-1"), cache.trouverCle("apple-1")]);
  assert.ok(cles.every((trouvee) => trouvee?.kid === "apple-1"));
  assert.equal(faux.etat.appels, 1);
  horloge += 119_000;
  await cache.trouverCle("apple-1");
  assert.equal(faux.etat.appels, 1, "encore frais");
  horloge += 2_000;
  await cache.trouverCle("apple-1");
  assert.equal(faux.etat.appels, 2, "max-age passé : rechargé");
  // kid inconnu : rechargé une fois… mais pas avant une minute après le dernier chargement
  assert.equal(await cache.trouverCle("apple-2"), null);
  assert.equal(faux.etat.appels, 2);
  horloge += 60_000;
  const nouvelle = creerCleTest("apple-2");
  faux.etat.cles.push(nouvelle.jwk);
  assert.equal((await cache.trouverCle("apple-2"))?.kid, "apple-2");
  assert.equal(faux.etat.appels, 3);
  assert.equal(await cache.trouverCle(""), null);
  assert.equal(await cache.trouverCle(42), null);
  // Sans Cache-Control : 1 h
  faux.etat.cacheControl = null;
  horloge += 3_600_000;
  await cache.trouverCle("apple-1");
  const appels = faux.etat.appels;
  horloge += 3_599_000;
  await cache.trouverCle("apple-1");
  assert.equal(faux.etat.appels, appels);
});

test("cache des clés : panne sans clé en mémoire → ClesIndisponibles ; panne avec clés → les anciennes servent", async () => {
  let horloge = MAINTENANT;
  const faux = creerFauxFournisseur("google", () => horloge);
  const cache = creerCacheCles({ adresse: "https://exemple.invalid/cles", chercher: faux.chercher, horloge: () => horloge });
  faux.etat.panne = true;
  await assert.rejects(cache.trouverCle("google-1"), ClesIndisponibles);
  await assert.rejects(cache.trouverCle("google-1"), ClesIndisponibles, "pas de nouvel appel dans les 5 s : toujours rien");
  assert.equal(faux.etat.appels, 1);
  horloge += 5_000;
  faux.etat.panne = false;
  assert.equal((await cache.trouverCle("google-1"))?.kid, "google-1");
  horloge += 2 * 3_600_000;
  faux.etat.panne = true;
  assert.equal((await cache.trouverCle("google-1"))?.kid, "google-1", "les anciennes clés servent pendant la panne");
  // Réponse illisible
  const illisible = creerCacheCles({
    adresse: "x", horloge: () => horloge,
    chercher: async () => ({ ok: true, status: 200, headers: { get: () => null }, json: async () => ({ cles: [] }) }),
  });
  await assert.rejects(illisible.trouverCle("a"), ClesIndisponibles);
  const statut = creerCacheCles({
    adresse: "x", horloge: () => horloge,
    chercher: async () => ({ ok: false, status: 500, headers: { get: () => null }, json: async () => ({}) }),
  });
  await assert.rejects(statut.trouverCle("a"), ClesIndisponibles);
});

test("vérificateurs : Apple par défaut sur fr.sosmiam.app, nonce obligatoire ; Google absent sans identifiant client", async () => {
  const faux = creerFauxFournisseur("apple", () => MAINTENANT);
  const apple = creerVerificateurApple({ chercher: faux.chercher, horloge: () => MAINTENANT });
  assert.ok(apple);
  assert.equal((await apple(faux.jeton("sub-1", "a@exemple.fr", NONCE), NONCE))?.sub, "sub-1");
  assert.equal(await apple(faux.jeton("sub-1", "a@exemple.fr", NONCE), null), null);
  assert.equal(await apple(faux.jeton("sub-1", "a@exemple.fr", NONCE), "un-autre-nonce"), null);
  assert.equal(await apple("pas-un-jeton", NONCE), null);
  assert.equal(creerVerificateurApple({ audiences: [] }), null);
  assert.equal(creerVerificateurGoogle({ audiences: [] }), null);
  assert.deepEqual(lireListeVirgules(" a.apps , b ,,a.apps "), ["a.apps", "b"]);
  assert.deepEqual(lireListeVirgules(undefined, ["fr.sosmiam.app"]), ["fr.sosmiam.app"]);
  assert.deepEqual(lireListeVirgules(""), []);
});
