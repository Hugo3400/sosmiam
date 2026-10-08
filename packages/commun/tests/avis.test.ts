import { test } from "node:test";
import assert from "node:assert/strict";
import { calculerMoyennePrudente } from "../src/fonctions/avis/calculer-moyenne-prudente.ts";
import { calculerPartRetour } from "../src/fonctions/avis/calculer-part-retour.ts";

const proche = (a: number | null, b: number) => assert.ok(a !== null && Math.abs(a - b) < 1e-9, `${a} au lieu de ${b}`);

test("moyenne prudente : null sans note", () => {
  assert.equal(calculerMoyennePrudente([]), null);
});

test("moyenne prudente : une seule note reste proche de 4", () => {
  proche(calculerMoyennePrudente([5]), (5 * 4 + 5) / 6);
  proche(calculerMoyennePrudente([1]), (5 * 4 + 1) / 6);
});

test("moyenne prudente : avec 50 notes, elle rejoint la vraie moyenne", () => {
  proche(calculerMoyennePrudente(Array(50).fill(5)), (20 + 250) / 55);
  proche(calculerMoyennePrudente(Array(50).fill(2)), (20 + 100) / 55);
  const melange = [...Array(25).fill(5), ...Array(25).fill(3)];
  proche(calculerMoyennePrudente(melange), (20 + 200) / 55);
});

test("moyenne prudente : a priori et poids réglables", () => {
  proche(calculerMoyennePrudente([5, 5], 3, 2), (6 + 10) / 4);
});

/** n clients venus une seule fois */
const clientsUneFois = (n: number, debut = 0) =>
  Array.from({ length: n }, (_, i) => ({ client: `c${debut + i}`, jour: "2026-10-01" }));

test("part de retour : compte les clients venus au moins 2 jours distincts", () => {
  const visites = [
    ...clientsUneFois(12),
    // 5 clients revenus un autre jour
    ...Array.from({ length: 5 }, (_, i) => [
      { client: `r${i}`, jour: "2026-10-01" },
      { client: `r${i}`, jour: "2026-10-05" },
    ]).flat(),
    // 3 clients venus deux fois le même jour : ils ne « reviennent » pas
    ...Array.from({ length: 3 }, (_, i) => [
      { client: `m${i}`, jour: "2026-10-02" },
      { client: `m${i}`, jour: "2026-10-02" },
    ]).flat(),
  ];
  proche(calculerPartRetour(visites), 5 / 20);
});

test("part de retour : null en dessous de 20 clients", () => {
  assert.equal(calculerPartRetour([]), null);
  assert.equal(calculerPartRetour(clientsUneFois(19)), null);
  proche(calculerPartRetour(clientsUneFois(20)), 0);
  // Les visites répétées d'un même client ne font pas grimper le nombre de clients
  const memeClient = Array.from({ length: 30 }, (_, i) => ({ client: "c0", jour: `2026-10-${String(i + 1).padStart(2, "0")}` }));
  assert.equal(calculerPartRetour(memeClient), null);
  proche(calculerPartRetour(memeClient, 1), 1);
});
