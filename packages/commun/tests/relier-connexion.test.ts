import { test } from "node:test";
import assert from "node:assert/strict";
import { creerClientHttp } from "../src/client-api/client-http.ts";
import { creerCompteApi } from "../src/client-api/api/api-compte.ts";

type Appel = { url: string; methode: string; corps: unknown };
const json = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut, headers: { "Content-Type": "application/json" } });

function creerService(reponses: Response[]) {
  const appels: Appel[] = [];
  const faux = (async (url: string, init: RequestInit) => {
    appels.push({ url, methode: String(init.method), corps: init.body ? JSON.parse(String(init.body)) : undefined });
    return reponses.shift() ?? json(500, {});
  }) as unknown as typeof fetch;
  const client = creerClientHttp({ adresse: "https://api.exemple.fr", lireJeton: async () => "jeton-1", fetch: faux });
  return { appels, service: creerCompteApi(client) };
}

test("relier : le mot de passe à côté du jeton à relier ; le jeton de l'autre fournisseur à part, dans « confirmation »", async () => {
  const connexions = { motDePasse: false, apple: true, google: true };
  const { appels, service } = creerService([json(200, { ok: true, connexions }), json(200, { ok: true, connexions }), json(200, { ok: true, connexions })]);
  const apple = { fournisseur: "apple", identityToken: "jeton-apple", nonce: "nonce-apple-01" } as const;
  assert.deepEqual(await service.relierConnexion(apple, { motDePasse: "mon chat adore les croissants" }), { ok: true, connexions });
  assert.deepEqual([appels[0].methode, appels[0].url], ["POST", "https://api.exemple.fr/comptes/moi/connexions/apple"]);
  assert.deepEqual(appels[0].corps, { identityToken: "jeton-apple", nonce: "nonce-apple-01", motDePasse: "mon chat adore les croissants" });
  await service.relierConnexion(apple, { idToken: "jeton-google", nonce: "nonce-google-02" });
  assert.deepEqual(appels[1].corps, { identityToken: "jeton-apple", nonce: "nonce-apple-01", confirmation: { idToken: "jeton-google", nonce: "nonce-google-02" } });
  await service.relierConnexion({ fournisseur: "google", idToken: "jeton-google" }, { identityToken: "jeton-apple", nonce: "nonce-apple-01" });
  assert.deepEqual([appels[2].url, appels[2].corps], [
    "https://api.exemple.fr/comptes/moi/connexions/google", { idToken: "jeton-google", confirmation: { identityToken: "jeton-apple", nonce: "nonce-apple-01" } },
  ]);
});
