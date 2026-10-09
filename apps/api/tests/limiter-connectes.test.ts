import assert from "node:assert/strict";
import { test } from "node:test";

import { creerLimiteConnectes } from "../src/middlewares/limiter-connectes.ts";

const JETON_A = "a".repeat(43);
const JETON_B = "b".repeat(43);

/** Passe une requête dans le middleware : rend le statut (200 si la suite est appelée, sinon celui posé) */
function appeler(limite: ReturnType<typeof creerLimiteConnectes>, jeton: string | null, ip = "203.0.113.7"): number {
  let statut = 0;
  const entetes: Record<string, string> = { "x-ip-visiteur": ip };
  if (jeton) entetes.authorization = `Bearer ${jeton}`;
  const requete = { get: (nom: string) => entetes[nom.toLowerCase()], socket: { remoteAddress: ip }, ip } as never;
  const reponse = {
    status(s: number) { statut = s; return this; }, set() { return this; }, setHeader() { return this; }, json() { return this; },
  } as never;
  limite(requete, reponse, () => { statut = 200; });
  return statut;
}

test("limite « connecté » : comptée par session derrière une même IP, avec une limite large par IP", () => {
  const limite = creerLimiteConnectes({ fenetre: 60_000, maximum: 3 }, { fenetre: 60_000, maximum: 7 });
  // Deux téléphones derrière la même IP : chacun a ses 3 appels
  assert.deepEqual([1, 2, 3, 4].map(() => appeler(limite, JETON_A)), [200, 200, 200, 429]);
  assert.deepEqual([1, 2, 3].map(() => appeler(limite, JETON_B)), [200, 200, 200]);
  // La limite large par IP (7) s'arrête là, quel que soit le jeton
  assert.equal(appeler(limite, "c".repeat(43)), 429);
  // Une autre IP n'est pas gênée
  assert.equal(appeler(limite, "d".repeat(43), "198.51.100.9"), 200);
});
