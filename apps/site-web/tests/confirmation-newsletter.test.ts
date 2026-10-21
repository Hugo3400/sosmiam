import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { after, test } from "node:test";

// @ts-ignore : Node a besoin de l'extension « .ts », que la configuration TypeScript du site n'autorise pas dans un import
import { choisirRedirectionHote } from "../src/fonctions/hotes/choisir-redirection-hote.ts";

const BON = "AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-abcd";
const appels: { methode: string; url: string; ip: string | undefined; corps: string }[] = [];
let reponseForcee: number | null = null;
const serveur = createServer((requete, reponse) => {
  let corps = "";
  requete.on("data", (morceau) => (corps += morceau));
  requete.on("end", () => {
    appels.push({ methode: requete.method ?? "", url: requete.url ?? "", ip: requete.headers["x-ip-visiteur"] as string | undefined, corps });
    const json = (statut: number, contenu: object) => void reponse.writeHead(statut, { "Content-Type": "application/json" }).end(JSON.stringify(contenu));
    if (reponseForcee) return json(reponseForcee, { ok: false, erreur: "x" });
    const jeton = (JSON.parse(corps || "{}") as { jeton?: string }).jeton;
    return jeton === BON ? json(200, { ok: true }) : json(400, { ok: false, erreur: "jeton-invalide" });
  });
});
await new Promise<void>((pret) => serveur.listen(0, "127.0.0.1", pret));
after(() => serveur.close());
process.env.ADRESSE_API = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
// @ts-ignore : idem
const { aFormeDeJetonConfirmation, confirmerNewsletter } = await import("../src/services/confirmation-newsletter.server.ts");

test("le bouton confirme : POST /newsletter/confirmation, jeton dans le corps JSON (jamais dans l'adresse), IP transmise", async () => {
  appels.length = 0;
  assert.equal(await confirmerNewsletter(BON, "203.0.113.7"), "ok");
  assert.deepEqual(appels, [{ methode: "POST", url: "/newsletter/confirmation", ip: "203.0.113.7", corps: JSON.stringify({ jeton: BON }) }]);
});

test("lien déjà servi ou expiré : jeton-invalide ; mal formé : sans même appeler l'API", async () => {
  appels.length = 0;
  for (const jeton of [null, "", "court", "pas un jeton du tout, avec des espaces", `${"A".repeat(200)}`, "abc.def.ghijklmnopqrstuvwxyz0123456789"]) {
    assert.equal(aFormeDeJetonConfirmation(jeton), false, String(jeton));
    assert.equal(await confirmerNewsletter(jeton, null), "jeton-invalide");
  }
  assert.equal(appels.length, 0);
  assert.equal(await confirmerNewsletter("Z".repeat(43), null), "jeton-invalide");
  assert.equal(appels.length, 1);
});

test("trop d'essais (429) ou panne de l'API : on le dit sans détail", async () => {
  reponseForcee = 429;
  assert.equal(await confirmerNewsletter(BON, null), "trop-de-demandes");
  reponseForcee = 503;
  assert.equal(await confirmerNewsletter(BON, null), "indisponible");
  reponseForcee = 500;
  assert.equal(await confirmerNewsletter(BON, null), "indisponible");
  reponseForcee = null;
});

test("partage des hôtes : /confirmer-newsletter est servie sur sosmiam.fr, et renvoyée vers sosmiam.fr avec son jeton", () => {
  assert.equal(choisirRedirectionHote("sosmiam.fr", `/confirmer-newsletter?jeton=${BON}`), null);
  assert.equal(choisirRedirectionHote("sosmiam.fr", `/confirmer-newsletter.data?jeton=${BON}`), null);
  for (const hote of ["pro.sosmiam.fr", "ambassadeur.sosmiam.fr"]) {
    assert.deepEqual(choisirRedirectionHote(hote, `/confirmer-newsletter?jeton=${BON}`), {
      adresse: `https://sosmiam.fr/confirmer-newsletter?jeton=${BON}`, statut: 301,
    });
  }
});
