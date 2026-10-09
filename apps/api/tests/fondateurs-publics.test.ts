// Tests des adresses publiques des fondateurs (sans session) : recherche de commune, zone d'une commune, toutes les zones
// et leurs places ; cache public court et limites par visiteur. Zones en mémoire, tirées du vrai fichier des communes.
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import { creerComptesEnMemoire } from "../src/services/comptes-en-memoire.ts";
import type { ZoneVue } from "../src/services/zones-fondateurs.ts";

const memoire = creerComptesEnMemoire();
const serveur = creerApplication({ enregistrerInscription: async () => {}, zones: memoire.zones }).listen(0, "127.0.0.1");
let adresse = "";
before(() => new Promise<void>((pret) => serveur.once("listening", () => {
  adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  pret();
})));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));

type Corps = {
  ok: boolean; erreur?: string; communes?: { code: string; nom: string; nomDepartement: string; codePostal: string | null }[];
  commune?: { code: string; nom: string; nomDepartement: string; codeDepartement: string; population: number }; zone?: ZoneVue;
  zones?: ZoneVue[]; total?: { places: number; prises: number };
};
let visiteur = 0;
async function lire(chemin: string, ip = `visiteur-${++visiteur}`) {
  const reponse = await fetch(`${adresse}${chemin}`, { headers: { "X-IP-Visiteur": ip } });
  return { statut: reponse.status, corps: (await reponse.json()) as Corps, cache: reponse.headers.get("cache-control") };
}

/** Une candidature acceptée (ou « souvenir ») dans cette zone, posée directement dans le double */
let compte = 0;
function poserFondateur(zoneCode: string, statut: "acceptee" | "souvenir" | "en-attente") {
  memoire.candidatures.push({
    id: 1000 + ++compte, compteId: 1000 + compte, statut, communeCode: zoneCode, zoneCode, numeroLocal: null, numeroNational: null,
    creeLe: Date.now(), reponduLe: null, pepites: "", envies: [], reseaux: null, motivation: "", partantRencontre: true, connuPar: null,
  });
}

test("GET /communes : nom ou code postal, limite de 1 à 20, en cache une heure", async () => {
  const lyon = await lire("/communes?recherche=lyon&limite=3");
  assert.equal(lyon.statut, 200);
  assert.equal(lyon.cache, "public, max-age=3600");
  assert.equal(lyon.corps.communes?.length, 3);
  assert.deepEqual(lyon.corps.communes?.[0], { code: "69123", nom: "Lyon", nomDepartement: "Rhône", codeDepartement: "69", population: 519127, codePostal: null });
  const postal = await lire("/communes?recherche=69003");
  assert.deepEqual(postal.corps.communes?.map(({ nom, codePostal }) => [nom, codePostal]), [["Lyon", "69003"]]);
  assert.equal((await lire("/communes?recherche=saint")).corps.communes?.length, 8, "8 par défaut");
  assert.equal((await lire("/communes?recherche=saint&limite=500")).corps.communes?.length, 20);
  assert.equal((await lire("/communes?recherche=saint&limite=abc")).corps.communes?.length, 8);
  for (const vide of ["/communes", "/communes?recherche=", `/communes?recherche=${"a".repeat(81)}`, "/communes?recherche=lyon&recherche=paris"]) {
    assert.deepEqual((await lire(vide)).corps, { ok: true, communes: [] }, vide);
  }
});

test("GET /fondateurs/zone : la commune et sa zone ; 404 « commune-inconnue » sinon", async () => {
  const lyon = await lire("/fondateurs/zone?commune=69383");
  assert.equal(lyon.statut, 200);
  assert.equal(lyon.cache, "public, max-age=60");
  assert.deepEqual(lyon.corps, {
    ok: true,
    commune: { code: "69123", nom: "Lyon", nomDepartement: "Rhône", codeDepartement: "69", population: 519127 },
    zone: { code: "69123", type: "ville", nom: "Lyon", nomAvecDe: "de Lyon", places: 10, prises: 0, libres: 10 },
  });
  const petite = await lire("/fondateurs/zone?commune=01001");
  assert.deepEqual([petite.corps.zone?.code, petite.corps.zone?.type, petite.corps.zone?.places], ["D01", "departement", 1]);
  assert.equal((await lire("/fondateurs/zone?commune=98735")).corps.zone?.code, "D987", "Papeete : Polynésie française");
  for (const chemin of ["/fondateurs/zone", "/fondateurs/zone?commune=", "/fondateurs/zone?commune=99999", "/fondateurs/zone?commune=lyon"]) {
    const reponse = await lire(chemin);
    assert.deepEqual([reponse.statut, reponse.corps], [404, { ok: false, erreur: "commune-inconnue" }], chemin);
  }
});

test("GET /fondateurs/zones : 241 zones et 367 places ; seules les candidatures acceptées prennent une place", async () => {
  const avant = await lire("/fondateurs/zones");
  assert.equal(avant.cache, "public, max-age=60");
  assert.equal(avant.corps.zones?.length, 241);
  assert.deepEqual(avant.corps.total, { places: 367, prises: 0 });
  assert.deepEqual(avant.corps.zones?.slice(0, 3).map(({ code, places }) => [code, places]), [["75056", 10], ["13055", 10], ["69123", 10]]);
  assert.deepEqual(avant.corps.zones?.at(-1)?.code, "D988", "les départements et collectivités à la fin, par code");
  assert.equal(avant.corps.zones?.filter((zone) => zone.type === "ville").length, 135);
  poserFondateur("69123", "acceptee");
  poserFondateur("69123", "acceptee");
  poserFondateur("69123", "souvenir");
  poserFondateur("69123", "en-attente");
  poserFondateur("D01", "acceptee");
  const apres = await lire("/fondateurs/zones");
  assert.deepEqual(apres.corps.total, { places: 367, prises: 3 });
  assert.deepEqual(apres.corps.zones?.find((zone) => zone.code === "69123"), { code: "69123", type: "ville", nom: "Lyon", nomAvecDe: "de Lyon", places: 10, prises: 2, libres: 8 });
  assert.deepEqual((await lire("/fondateurs/zone?commune=01001")).corps.zone?.libres, 0);
  assert.deepEqual(await memoire.zones.lireZone("D01"), { code: "D01", type: "departement", nom: "Ain", nomAvecDe: "d'Ain", places: 1, prises: 1, libres: 0 });
  assert.equal(await memoire.zones.lireZone("D75"), null, "Paris n'a pas de zone de département");
});

test("limites par visiteur : 300 lectures de zones et 600 recherches de communes par 10 minutes, puis 429", async () => {
  for (let i = 0; i < 300; i++) assert.equal((await lire("/fondateurs/zone?commune=69123", "gourmand")).statut, 200);
  const trop = await lire("/fondateurs/zones", "gourmand");
  assert.deepEqual([trop.statut, trop.corps], [429, { ok: false, erreur: "trop-de-demandes" }], "une seule limite pour les deux adresses des zones");
  assert.equal((await lire("/communes?recherche=lyon", "gourmand")).statut, 200, "la recherche a sa propre limite");
  for (let i = 0; i < 600; i++) assert.equal((await lire("/communes?recherche=ly", "affame")).statut, 200);
  assert.equal((await lire("/communes?recherche=ly", "affame")).statut, 429);
  assert.equal((await lire("/fondateurs/zones", "un-autre")).statut, 200);
});

test("sans les zones, ces adresses n'existent pas", async () => {
  const autre = creerApplication({ enregistrerInscription: async () => {} }).listen(0, "127.0.0.1");
  await new Promise<void>((pret) => autre.once("listening", () => pret()));
  const reponse = await fetch(`http://127.0.0.1:${(autre.address() as AddressInfo).port}/fondateurs/zones`);
  assert.equal(reponse.status, 404);
  await new Promise<void>((fini) => autre.close(() => fini()));
});
