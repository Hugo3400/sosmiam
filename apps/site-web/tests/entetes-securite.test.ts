import assert from "node:assert/strict";
import { test } from "node:test";

import { creerEntetesSecurite } from "../src/fonctions/securite/creer-entetes-securite.ts";

function lireDirectives(politique: string): Map<string, string[]> {
  return new Map(
    politique.split(";").map((directive) => {
      const [nom, ...sources] = directive.trim().split(/\s+/);
      return [nom, sources];
    }),
  );
}

test("en ligne : scripts du site et du nonce de la page seulement, ni eval ni script en ligne", () => {
  const directives = lireDirectives(creerEntetesSecurite("c29zbWlhbQ==", false)["Content-Security-Policy"]);
  assert.deepEqual(directives.get("default-src"), ["'self'"]);
  assert.deepEqual(directives.get("script-src"), ["'self'", "'nonce-c29zbWlhbQ=='"]);
  assert.deepEqual(directives.get("connect-src"), ["'self'"]);
  assert.deepEqual(directives.get("img-src"), ["'self'"]);
  assert.deepEqual(directives.get("font-src"), ["'self'"]);
  assert.deepEqual(directives.get("object-src"), ["'none'"]);
  assert.deepEqual(directives.get("base-uri"), ["'self'"]);
  assert.deepEqual(directives.get("form-action"), ["'self'"]);
  assert.deepEqual(directives.get("frame-ancestors"), ["'none'"]);
  for (const [nom, sources] of directives) {
    assert.ok(!sources.some((source) => ["'unsafe-eval'", "ws:", "*", "http:", "https:", "data:"].includes(source)), nom);
    if (nom !== "style-src") assert.ok(!sources.includes("'unsafe-inline'"), nom);
  }
});

test("en développement : seulement la websocket du rechargement à chaud de Vite (ws:) en plus, ni eval ni script en ligne", () => {
  const enLigne = lireDirectives(creerEntetesSecurite("YWJj", false)["Content-Security-Policy"]);
  const developpement = lireDirectives(creerEntetesSecurite("YWJj", true)["Content-Security-Policy"]);
  assert.deepEqual(developpement.get("connect-src"), ["'self'", "ws:"]);
  assert.deepEqual(developpement.get("script-src"), ["'self'", "'nonce-YWJj'"]);
  assert.deepEqual([...developpement.keys()], [...enLigne.keys()]);
  for (const nom of enLigne.keys()) {
    if (nom !== "connect-src") assert.deepEqual(developpement.get(nom), enLigne.get(nom), nom);
  }
});

test("chaque page a son nonce : la politique reprend celui qu'on lui donne", () => {
  const premiere = creerEntetesSecurite("cHJlbWllcmU=", false)["Content-Security-Policy"];
  const seconde = creerEntetesSecurite("c2Vjb25kZQ==", false)["Content-Security-Policy"];
  assert.match(premiere, /'nonce-cHJlbWllcmU='/);
  assert.match(seconde, /'nonce-c2Vjb25kZQ=='/);
  assert.doesNotMatch(seconde, /cHJlbWllcmU=/);
});

test("Permissions-Policy : caméra, micro, paiement et capteurs coupés ; la position reste au site (bouton 📍 de l'accueil)", () => {
  const permissions = creerEntetesSecurite("YWJj", false)["Permissions-Policy"].split(", ");
  for (const coupee of ["camera=()", "microphone=()", "payment=()", "usb=()", "display-capture=()", "accelerometer=()"]) {
    assert.ok(permissions.includes(coupee), coupee);
  }
  assert.ok(permissions.includes("geolocation=(self)"));
  assert.ok(!permissions.some((permission) => permission.startsWith("clipboard-")));
  assert.equal(creerEntetesSecurite("YWJj", true)["Permissions-Policy"], permissions.join(", "));
});
