import { test } from "node:test";
import assert from "node:assert/strict";
import { creerClientHttp } from "../src/client-api/client-http.ts";
import { creerEcouteReguliere } from "../src/client-api/api/creer-ecoute-reguliere.ts";

type Appel = { url: string; methode: string; entetes: Record<string, string>; corps: unknown };

/** Un faux fetch : rend la réponse donnée et note chaque appel */
function fauxServeur(reponse: () => Response | Promise<Response>) {
  const appels: Appel[] = [];
  const faux = (async (url: string, init: RequestInit) => {
    appels.push({ url, methode: String(init.method), entetes: init.headers as Record<string, string>, corps: init.body ? JSON.parse(String(init.body)) : undefined });
    return reponse();
  }) as unknown as typeof fetch;
  return { appels, faux };
}
const json = (statut: number, corps: unknown, entetes: Record<string, string> = {}) =>
  new Response(JSON.stringify(corps), { status: statut, headers: { "Content-Type": "application/json", ...entetes } });

test("client HTTP : session en Bearer, corps JSON, réponse { ok } rendue telle quelle", async () => {
  const { appels, faux } = fauxServeur(() => json(201, { ok: true, visite: { id: 3 } }));
  const client = creerClientHttp({ adresse: "https://api.exemple.fr/", lireJeton: async () => "jeton-1", fetch: faux });
  const r = await client.demander<{ visite: { id: number } }>("POST", "/app/visites/addition", { corps: { lieuId: 1 } });
  assert.deepEqual(r, { ok: true, visite: { id: 3 } });
  assert.deepEqual([appels[0].url, appels[0].methode, appels[0].entetes.Authorization, appels[0].corps], ["https://api.exemple.fr/app/visites/addition", "POST", "Bearer jeton-1", { lieuId: 1 }]);
  // Lecture publique : jamais de jeton
  await client.demander("GET", "/miam-safe/lieux/1", { session: false });
  assert.equal(appels[1].entetes.Authorization, undefined);
});

test("client HTTP : erreurs traduites pour l'app", async () => {
  const cas: [Response | "reseau", unknown][] = [
    [json(409, { ok: false, erreur: "demande-en-cours", details: { lieu: "Chez Léa", lieuId: 2, autre: "x" } }), { ok: false, erreur: "demande-en-cours", details: { lieu: "Chez Léa", lieuId: 2 } }],
    [json(403, { ok: false, erreur: "pas-pro" }), { ok: false, erreur: "role-requis" }],
    [json(400, { ok: false, erreur: "champ-invalide", champ: "pseudo" }), { ok: false, erreur: "champ-invalide", champ: "pseudo" }],
    [json(400, { ok: false, erreur: "code-inconnu-de-l-app" }), { ok: false, erreur: "erreur-serveur" }],
    [json(503, { ok: false, erreur: "chiffrement-indisponible" }), { ok: false, erreur: "erreur-serveur" }],
    [json(429, { ok: false, erreur: "trop-de-demandes" }, { "Retry-After": "42" }), { ok: false, erreur: "trop-de-demandes", details: { attenteS: 42 } }],
    [new Response("<html>502</html>", { status: 502 }), { ok: false, erreur: "erreur-serveur" }],
    ["reseau", { ok: false, erreur: "hors-ligne" }],
  ];
  for (const [reponse, attendu] of cas) {
    const faux = (async () => {
      if (reponse === "reseau") throw new TypeError("Network request failed");
      return reponse;
    }) as unknown as typeof fetch;
    const client = creerClientHttp({ adresse: "https://api.exemple.fr", lireJeton: () => null, fetch: faux });
    assert.deepEqual(await client.demander("GET", "/x"), attendu);
  }
});

test("client HTTP : session expirée → « connexion-requise » et l'app oublie le jeton ; trop long → hors-ligne", async () => {
  let oubliee = 0;
  const { faux } = fauxServeur(() => json(401, { ok: false, erreur: "session-expiree" }));
  const client = creerClientHttp({ adresse: "https://api.exemple.fr", lireJeton: () => "vieux", surSessionExpiree: () => oubliee++, fetch: faux });
  assert.deepEqual(await client.demander("GET", "/app/visites"), { ok: false, erreur: "connexion-requise" });
  assert.equal(oubliee, 1);
  const lent = ((_url: string, init: RequestInit) =>
    new Promise((_ok, ko) => init.signal?.addEventListener("abort", () => ko(new Error("abandonné"))))) as unknown as typeof fetch;
  const pressé = creerClientHttp({ adresse: "https://api.exemple.fr", lireJeton: () => null, delaiMs: 20, fetch: lent });
  assert.deepEqual(await pressé.demander("GET", "/x"), { ok: false, erreur: "hors-ligne" });
});

test("écoute régulière : prévient tous les abonnés, s'arrête quand plus personne n'écoute", async () => {
  const ecouter = creerEcouteReguliere(10);
  let a = 0;
  let b = 0;
  const finA = ecouter(() => a++);
  const finB = ecouter(() => b++);
  await new Promise((fini) => setTimeout(fini, 35));
  finA();
  finB();
  const [avantA, avantB] = [a, b];
  assert.ok(avantA >= 2 && avantB >= 2);
  await new Promise((fini) => setTimeout(fini, 30));
  assert.deepEqual([a, b], [avantA, avantB]);
});
