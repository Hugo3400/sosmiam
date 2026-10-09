// Tests du rattachement d'un compte à son lieu (espace pro) : « Chercher mon lieu », demander à gérer un lieu (preuve,
// SIRET, lieu masqué, doublon, redemande après refus, limites), `compte.pro` et la liste de ses rattachements.
// Tout en mémoire : aucune base de données n'est touchée.
import assert from "node:assert/strict";
import { after, test } from "node:test";

import { LIMITE_RATTACHEMENTS } from "../src/routes/comptes.ts";
import { creerBancPro } from "./outils/creer-banc-pro.ts";

const { banc, memoire, demander, creerCompte, ajouterLieu, fermer } = await creerBancPro();
after(fermer);
const demanderLieu = (jeton: string, corps: Record<string, unknown>, ip?: string) =>
  demander("POST", "/comptes/moi/rattachements", { jeton, corps: { role: "gerant", preuve: "Je suis le gérant, Kbis à l'appui.", ...corps }, ip });

test("sans session : 401 partout", async () => {
  const lieuId = ajouterLieu();
  for (const [methode, chemin] of [
    ["GET", "/comptes/moi/rattachements"], ["POST", "/comptes/moi/rattachements"], ["POST", "/comptes/moi/rattachements/1/accepter"],
    ["DELETE", "/comptes/moi/rattachements/1"], ["GET", "/pro/recherche-lieux?texte=lea"], ["GET", `/pro/lieux/${lieuId}`],
  ]) {
    const { statut, corps } = await demander(methode as string, chemin as string, { corps: methode === "GET" ? undefined : { lieuId } });
    assert.equal(statut, 401, `${methode} ${chemin}`);
    assert.equal(corps.erreur, "session-expiree");
  }
});

test("chercher mon lieu : nom ou ville, publiés et brouillons, sans données privées, 10 au plus", async () => {
  const { jeton } = await creerCompte();
  const publie = ajouterLieu({ nom: "La Fournée Zigzag", ville: "Sète" });
  const brouillon = ajouterLieu({ nom: "Zigzag Pizza", ville: "Agde", statut: "brouillon" });
  ajouterLieu({ nom: "Zigzag Caché", statut: "masque" });
  const { statut, corps, entetes } = await demander("GET", `/pro/recherche-lieux?texte=${encodeURIComponent("  zigZAG ")}`, { jeton });
  assert.equal(statut, 200);
  assert.equal(entetes.get("cache-control"), "private, no-store");
  assert.deepEqual(corps.lieux, [
    { id: publie, nom: "La Fournée Zigzag", emoji: "🍝", type: "resto", quartier: "Écusson", ville: "Sète", statut: "publie", estVerifie: false },
    { id: brouillon, nom: "Zigzag Pizza", emoji: "🍝", type: "resto", quartier: "Écusson", ville: "Agde", statut: "brouillon", estVerifie: false },
  ]);
  // Chaque mot doit se trouver dans le nom ou la ville
  const deuxMots = await demander("GET", "/pro/recherche-lieux?texte=zigzag%20agde", { jeton });
  assert.deepEqual(deuxMots.corps.lieux.map((l: { id: number }) => l.id), [brouillon]);
  for (let i = 0; i < 12; i++) ajouterLieu({ nom: `Plouf ${String(i).padStart(2, "0")}` });
  const beaucoup = await demander("GET", "/pro/recherche-lieux?texte=plouf", { jeton });
  assert.equal(beaucoup.corps.lieux.length, 10);
  for (const texte of ["", "a", "x".repeat(81)]) {
    const mauvais = await demander("GET", `/pro/recherche-lieux?texte=${texte}`, { jeton });
    assert.deepEqual([mauvais.statut, mauvais.corps], [400, { ok: false, erreur: "champ-invalide", champ: "texte" }], texte);
  }
});

test("demander à gérer un lieu : 201, en attente, visible dans compte.pro et dans la liste", async () => {
  const { id: compteId, jeton } = await creerCompte();
  const lieuId = ajouterLieu({ nom: "Le Comptoir", ville: "Lyon" });
  const { statut, corps } = await demanderLieu(jeton, { lieuId, siret: "732 829 320 00074" });
  assert.equal(statut, 201);
  assert.equal(corps.ok, true);
  const garde = memoire.rattachements.find((r) => r.id === corps.id);
  assert.deepEqual(garde, {
    id: corps.id, lieuId, compteId, role: "gerant", preuve: "Je suis le gérant, Kbis à l'appui.", siret: "73282932000074",
    statut: "en-attente", reponse: null, creeLe: banc.horloge, decideLe: null,
  });
  const session = await demander("GET", "/comptes/session", { jeton });
  assert.deepEqual(session.corps.compte.pro, { lieux: [{ lieuId, nom: "Le Comptoir", ville: "Lyon", role: "gerant", statut: "en-attente" }] });
  const liste = await demander("GET", "/comptes/moi/rattachements", { jeton });
  assert.deepEqual(liste.corps, {
    ok: true,
    rattachements: [{
      id: corps.id, lieuId, nom: "Le Comptoir", ville: "Lyon", emoji: "🍝", role: "gerant", statut: "en-attente", reponse: null,
      creeLe: new Date(banc.horloge).toISOString(), decideLe: null,
    }],
  });
});

test("demande invalide : 400 avec le champ ; lieu masqué ou absent : 404", async () => {
  const { jeton } = await creerCompte();
  const lieuId = ajouterLieu();
  const essais: [Record<string, unknown>, string][] = [
    [{ lieuId: "1" }, "lieuId"], [{ lieuId: 0 }, "lieuId"], [{ lieuId: 1.5 }, "lieuId"],
    [{ lieuId, role: "equipe" }, "role"], [{ lieuId, role: undefined }, "role"],
    [{ lieuId, preuve: "   " }, "preuve"], [{ lieuId, preuve: "x".repeat(601) }, "preuve"], [{ lieuId, preuve: 42 }, "preuve"],
    [{ lieuId, siret: "73282932000075" }, "siret"], [{ lieuId, siret: "123" }, "siret"], [{ lieuId, siret: 73282932000074 }, "siret"],
  ];
  for (const [corps, champ] of essais) {
    const { statut, corps: reponse } = await demanderLieu(jeton, corps);
    assert.deepEqual([statut, reponse], [400, { ok: false, erreur: "champ-invalide", champ }], JSON.stringify(corps));
  }
  for (const id of [ajouterLieu({ statut: "masque" }), 99_999]) {
    const { statut, corps } = await demanderLieu(jeton, { lieuId: id });
    assert.deepEqual([statut, corps], [404, { ok: false, erreur: "lieu-inconnu" }]);
  }
  // Brouillon : se demande ; SIRET vide : sans SIRET
  const brouillon = await demanderLieu(jeton, { lieuId: ajouterLieu({ statut: "brouillon" }), siret: "" });
  assert.equal(brouillon.statut, 201);
  assert.equal(memoire.rattachements.find((r) => r.id === brouillon.corps.id)?.siret, null);
});

test("déjà demandé : 409 ; après un refus ou un retrait, on redemande", async () => {
  const { jeton } = await creerCompte();
  const lieuId = ajouterLieu();
  const premiere = await demanderLieu(jeton, { lieuId });
  assert.deepEqual((await demanderLieu(jeton, { lieuId })).corps, { ok: false, erreur: "deja-demande" });
  assert.ok(memoire.deciderRattachement(premiere.corps.id, "refuse", "On n'a pas pu vérifier : envoie-nous un Kbis ?"));
  const refus = await demander("GET", "/comptes/moi/rattachements", { jeton });
  assert.equal(refus.corps.rattachements[0].reponse, "On n'a pas pu vérifier : envoie-nous un Kbis ?");
  banc.horloge += 60_000;
  const seconde = await demanderLieu(jeton, { lieuId, preuve: "Voici mon Kbis." });
  assert.equal(seconde.statut, 201);
  assert.equal(seconde.corps.id, premiere.corps.id, "une seule ligne par lieu et par compte");
  const remise = memoire.rattachements.find((r) => r.id === premiere.corps.id);
  assert.deepEqual([remise?.statut, remise?.reponse, remise?.decideLe, remise?.preuve], ["en-attente", null, null, "Voici mon Kbis."]);
  // Validé : toujours « déjà demandé » ; retiré (il quitte) : il peut redemander
  assert.ok(memoire.deciderRattachement(premiere.corps.id, "valide"));
  assert.equal((await demanderLieu(jeton, { lieuId })).statut, 409);
  assert.deepEqual((await demander("DELETE", `/comptes/moi/rattachements/${premiere.corps.id}`, { jeton })).corps, { ok: true });
  assert.deepEqual((await demander("GET", "/comptes/session", { jeton })).corps.compte.pro, { lieux: [] }, "« retire » n'apparaît plus");
  assert.equal((await demanderLieu(jeton, { lieuId })).statut, 201);
});

test("limites : 5 demandes par 24 h par compte, et par visiteur", async () => {
  const { jeton } = await creerCompte();
  for (let i = 0; i < 5; i++) assert.equal((await demanderLieu(jeton, { lieuId: ajouterLieu() })).statut, 201);
  const sixieme = await demanderLieu(jeton, { lieuId: ajouterLieu() });
  assert.deepEqual([sixieme.statut, sixieme.corps], [409, { ok: false, erreur: "trop-de-demandes" }]);
  banc.horloge += 24 * 3600_000 + 1;
  assert.equal((await demanderLieu(jeton, { lieuId: ajouterLieu() })).statut, 201, "24 h plus tard, ça repart");

  const autre = await creerCompte();
  const ip = "198.51.100.7";
  for (let i = 0; i < LIMITE_RATTACHEMENTS.maximum; i++) await demanderLieu(autre.jeton, { lieuId: 99_999 }, ip);
  const bloque = await demanderLieu(autre.jeton, { lieuId: ajouterLieu() }, ip);
  assert.deepEqual([bloque.statut, bloque.corps.erreur], [429, "trop-de-demandes"]);
});

test("pas pro : les pages /pro/lieux/:id répondent 403 pas-pro (aussi en attente, ou pour un lieu inconnu)", async () => {
  const { jeton } = await creerCompte();
  const lieuId = ajouterLieu();
  await demanderLieu(jeton, { lieuId });
  for (const chemin of [`/pro/lieux/${lieuId}`, `/pro/lieux/${lieuId}/suggestions`, `/pro/lieux/${lieuId}/equipe`, "/pro/lieux/99999", "/pro/lieux/abc"]) {
    const { statut, corps } = await demander("GET", chemin, { jeton });
    assert.deepEqual([statut, corps], [403, { ok: false, erreur: "pas-pro" }], chemin);
  }
  const patch = await demander("PATCH", `/pro/lieux/${lieuId}`, { jeton, corps: { horaires: "Tous les jours" } });
  assert.equal(patch.statut, 403);
  assert.equal(memoire.lieux.get(lieuId)?.horaires, "Mar–sam, 12h–14h30");
});

test("compte effacé : ses rattachements partent avec lui", async () => {
  const { id, jeton } = await creerCompte();
  await demanderLieu(jeton, { lieuId: ajouterLieu() });
  await memoire.services.effacerCompte(id);
  assert.equal(memoire.rattachements.some((r) => r.compteId === id), false);
});
