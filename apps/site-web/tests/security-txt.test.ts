import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { creerFichierSecurityTxt } from "../src/fonctions/securite/creer-fichier-security-txt.ts";
import { repondreSecurityTxt } from "../src/fonctions/securite/repondre-security-txt.ts";
import { choisirRedirectionHote } from "../src/fonctions/hotes/choisir-redirection-hote.ts";

const MAINTENANT = new Date("2026-10-22T09:30:15.123Z");
const lignes = (texte: string) => texte.trimEnd().split("\n");

test("creerFichierSecurityTxt : les champs de la RFC 9116, Expires dans 180 jours en UTC, une ligne vide à la fin", () => {
  const texte = creerFichierSecurityTxt(MAINTENANT);
  assert.deepEqual(lignes(texte), [
    "Contact: https://sosmiam.fr/securite",
    "Expires: 2027-04-20T09:30:15Z",
    "Preferred-Languages: fr, en",
    "Canonical: https://sosmiam.fr/.well-known/security.txt",
    "Policy: https://sosmiam.fr/securite",
    "Acknowledgments: https://sosmiam.fr/securite#tableau-d-honneur",
  ]);
  assert.ok(texte.endsWith("\n"));
  assert.doesNotMatch(texte, /\r/);
});

test("creerFichierSecurityTxt : Expires est recalculé à chaque appel, toujours dans le futur et à moins d'un an", () => {
  for (const moment of ["2026-12-31T23:59:59.999Z", "2027-02-28T00:00:00.000Z"]) {
    const maintenant = new Date(moment);
    const expires = /^Expires: (.+)$/m.exec(creerFichierSecurityTxt(maintenant))?.[1] ?? "";
    assert.match(expires, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    const ecart = Date.parse(expires) - maintenant.getTime();
    assert.ok(ecart > 179 * 86_400_000 && ecart <= 180 * 86_400_000, moment);
  }
});

test("repondreSecurityTxt : 200 en text/plain utf-8 sur sosmiam.fr, avec un cache", async () => {
  const reponse = repondreSecurityTxt(new Request("https://sosmiam.fr/.well-known/security.txt"), MAINTENANT);
  assert.equal(reponse.status, 200);
  assert.equal(reponse.headers.get("Content-Type"), "text/plain; charset=utf-8");
  assert.match(reponse.headers.get("Cache-Control") ?? "", /max-age=\d+/);
  assert.equal(await reponse.text(), creerFichierSecurityTxt(MAINTENANT));
});

test("repondreSecurityTxt : les espaces ambassadeur et pro renvoient vers l'adresse canonique", () => {
  for (const hote of ["ambassadeur.sosmiam.fr", "pro.sosmiam.fr"]) {
    const reponse = repondreSecurityTxt(new Request(`https://${hote}/.well-known/security.txt`));
    assert.equal(reponse.status, 301, hote);
    assert.equal(reponse.headers.get("Location"), "https://sosmiam.fr/.well-known/security.txt", hote);
  }
  assert.equal(repondreSecurityTxt(new Request("http://127.0.0.1:5190/.well-known/security.txt")).status, 200);
});

test("/.well-known/security.txt : branché dans routes.ts, jamais redirigé par le partage des hôtes", () => {
  const routes = readFileSync(`${import.meta.dirname}/../src/routes.ts`, "utf8");
  assert.match(routes, /route\("\.well-known\/security\.txt", "routes\/ressources\/fichier-security-txt\.ts"\)/);
  for (const hote of ["sosmiam.fr", "ambassadeur.sosmiam.fr", "pro.sosmiam.fr"]) {
    assert.equal(choisirRedirectionHote(hote, "/.well-known/security.txt"), null, hote);
  }
});
