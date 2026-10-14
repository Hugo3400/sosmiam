// « Je suis sur place » côté client (creerAmbassadeurApi) : la bonne route, la mission relue complétée, les refus de l'API.
import { test } from "node:test";
import assert from "node:assert/strict";
import { creerAmbassadeurApi } from "../src/client-api/api/api-ambassadeur.ts";
import { creerClientHttp } from "../src/client-api/client-http.ts";
import type { LecturePosition } from "../src/types/position.ts";

const POSITION: LecturePosition = { latitude: 43.6108, longitude: 3.8767, precision: 12, ageMs: 800, simulee: false };

function creerService(statut: number, corps: unknown) {
  const appels: { url: string; methode: string; corps: unknown }[] = [];
  const faux = (async (url: string, init: RequestInit) => {
    appels.push({ url, methode: String(init.method), corps: init.body ? JSON.parse(String(init.body)) : undefined });
    return new Response(JSON.stringify(corps), { status: statut, headers: { "Content-Type": "application/json" } });
  }) as unknown as typeof fetch;
  const client = creerClientHttp({ adresse: "https://api.exemple.fr", lireJeton: async () => "jeton", fetch: faux });
  return { appels, service: creerAmbassadeurApi(client, () => "actif") };
}

test("signalerPresence : POST /espace-ambassadeur/missions/:id/presence { position }, mission relue complétée", async () => {
  const mission = {
    id: 4, titre: "Vérifier", detail: "", echeance: null, statut: "a-faire", compteRendu: null, creeLe: "2026-10-10T08:00:00.000Z", faiteLe: null,
    type: null, presenceVerifieeLe: "2026-10-14T13:42:00.000Z", lieu: { id: 2, nom: "La Figue Pressée", ville: "Montpellier", emoji: "🍸", position: { latitude: 43.6, longitude: 3.8 } },
  };
  const { appels, service } = creerService(200, { ok: true, mission });
  const r = await service.signalerPresence(4, POSITION);
  assert.deepEqual(appels, [{ url: "https://api.exemple.fr/espace-ambassadeur/missions/4/presence", methode: "POST", corps: { position: POSITION } }]);
  assert.ok(r.ok);
  // type null (pas choisi dans le logiciel) : « autre »
  assert.deepEqual(r.mission, { ...mission, type: "autre" });
});

test("signalerPresence : les refus de l'API arrivent avec leurs détails", async () => {
  const loin = await creerService(422, { ok: false, erreur: "hors-zone", details: { distanceM: 1200, lieu: "La Figue Pressée" } }).service.signalerPresence(4, POSITION);
  assert.deepEqual(loin, { ok: false, erreur: "hors-zone", details: { distanceM: 1200, lieu: "La Figue Pressée" } });
  for (const erreur of ["deja-sur-place", "lieu-sans-position", "transition-interdite", "introuvable"] as const) {
    assert.deepEqual(await creerService(409, { ok: false, erreur }).service.signalerPresence(4, POSITION), { ok: false, erreur });
  }
});
