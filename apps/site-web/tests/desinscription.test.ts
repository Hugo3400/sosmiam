// Tests de la page /desinscription (lien « Me désinscrire » des mails de la newsletter) : appels à l'API (GET qui lit
// l'adresse masquée, POST qui désinscrit), simulés par une fausse API locale, et partage des hôtes. node --test tests/*.test.ts.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { after, test } from "node:test";

// @ts-ignore : Node a besoin de l'extension « .ts », que la configuration TypeScript du site n'autorise pas dans un import
import { choisirRedirectionHote } from "../src/fonctions/hotes/choisir-redirection-hote.ts";

const BON = "bGVhQGV4ZW1wbGUuZnI.AAAAAAAAAAAAAAAAAAAAAA";
const appels: { methode: string; url: string; ip: string | undefined }[] = [];
let reponseForcee: number | null = null;
const serveur = createServer((requete, reponse) => {
  appels.push({ methode: requete.method ?? "", url: requete.url ?? "", ip: requete.headers["x-ip-visiteur"] as string | undefined });
  const json = (statut: number, corps: object) => void reponse.writeHead(statut, { "Content-Type": "application/json" }).end(JSON.stringify(corps));
  if (reponseForcee) return json(reponseForcee, { ok: false, erreur: "x" });
  const jeton = new URL(requete.url ?? "", "http://x").searchParams.get("jeton");
  if (jeton !== BON) return json(400, { ok: false, erreur: "jeton-invalide" });
  return requete.method === "POST" ? json(200, { ok: true }) : json(200, { ok: true, email: "l***@exemple.fr" });
});
await new Promise<void>((pret) => serveur.listen(0, "127.0.0.1", pret));
after(() => serveur.close());
process.env.ADRESSE_API = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
// @ts-ignore : idem
const { desinscrireNewsletter, lireDesinscription } = await import("../src/services/desinscription.server.ts");

test("ouvrir la page lit seulement l'adresse masquée (GET) : rien n'est désinscrit", async () => {
  appels.length = 0;
  assert.deepEqual(await lireDesinscription(BON, "203.0.113.7"), { ok: true, email: "l***@exemple.fr" });
  assert.deepEqual(appels, [{ methode: "GET", url: `/newsletter/desinscription?jeton=${BON}`, ip: "203.0.113.7" }]);
});

test("le bouton désinscrit (POST) avec le même jeton", async () => {
  appels.length = 0;
  assert.equal(await desinscrireNewsletter(BON, null), "ok");
  assert.deepEqual(appels.map((appel) => appel.methode), ["POST"]);
});

test("jeton faux ou mal formé : jeton-invalide (sans appeler l'API s'il n'a pas la forme)", async () => {
  appels.length = 0;
  for (const jeton of [null, "", "pas un jeton", "a.b.c", `${"A".repeat(500)}.B`]) {
    assert.deepEqual(await lireDesinscription(jeton, null), { ok: false, erreur: "jeton-invalide" });
    assert.equal(await desinscrireNewsletter(jeton, null), "jeton-invalide");
  }
  assert.equal(appels.length, 0);
  assert.deepEqual(await lireDesinscription("abc.def", null), { ok: false, erreur: "jeton-invalide" });
  assert.equal(await desinscrireNewsletter("abc.def", null), "jeton-invalide");
});

test("trop d'essais (429) ou panne de l'API : on le dit sans détail", async () => {
  reponseForcee = 429;
  assert.deepEqual(await lireDesinscription(BON, null), { ok: false, erreur: "trop-de-demandes" });
  assert.equal(await desinscrireNewsletter(BON, null), "trop-de-demandes");
  reponseForcee = 503;
  assert.deepEqual(await lireDesinscription(BON, null), { ok: false, erreur: "indisponible" });
  assert.equal(await desinscrireNewsletter(BON, null), "indisponible");
  reponseForcee = null;
});

test("partage des hôtes : /desinscription est servie sur sosmiam.fr, et renvoyée vers sosmiam.fr avec son jeton", () => {
  assert.equal(choisirRedirectionHote("sosmiam.fr", `/desinscription?jeton=${BON}`), null);
  assert.equal(choisirRedirectionHote("sosmiam.fr", `/desinscription.data?jeton=${BON}`), null);
  assert.deepEqual(choisirRedirectionHote("pro.sosmiam.fr", `/desinscription?jeton=${BON}`), {
    adresse: `https://sosmiam.fr/desinscription?jeton=${BON}`, statut: 301,
  });
  assert.deepEqual(choisirRedirectionHote("ambassadeur.sosmiam.fr", `/desinscription?jeton=${BON}`), {
    adresse: `https://sosmiam.fr/desinscription?jeton=${BON}`, statut: 301,
  });
});
