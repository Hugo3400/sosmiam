import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { creerBancCommunaute, HEURE } from "./outils/creer-banc-communaute.ts";
import type { PersonneDeTest } from "./outils/creer-banc-social.ts";

let b: Awaited<ReturnType<typeof creerBancCommunaute>>;
before(async () => {
  b = await creerBancCommunaute();
});
after(() => b.banc.fermer());

const lire = async (p: PersonneDeTest) => (await p.demander("GET", "/app/communaute/qui-est-la")).corps;
const montrer = (p: PersonneDeTest, visible = true) => p.demander("PUT", "/app/communaute/qui-est-la", { visible });
const coucou = (p: PersonneDeTest, autre: PersonneDeTest) => p.demander("POST", `/app/communaute/coucous/${autre.idPublic}`);

test("qui est là : seulement ceux qui l'ont choisi, dans ta ville, le pseudo et l'avatar, 3 h puis effacé", async () => {
  const [lea, sam, ailleurs, discret] = [
    await b.banc.creerPersonne({ ville: "Montpellier" }), await b.banc.creerPersonne({ ville: "Montpellier", avatar: "🦀" }),
    await b.banc.creerPersonne({ ville: "Brest" }), await b.banc.creerPersonne({ ville: "Montpellier" }),
  ];
  const sansVille = await b.banc.creerPersonne({ ville: "" });
  assert.deepEqual((await montrer(sansVille)).corps, { ok: false, erreur: "ville-requise" });
  assert.deepEqual(await lire(lea), { ok: true, ville: "Montpellier", visible: false, jusqua: null, total: 0, presents: [] });
  const montre = await montrer(sam);
  assert.deepEqual(montre.corps, { ok: true, visible: true, jusqua: new Date(b.banc.horloge.maintenant + 3 * HEURE).toISOString() });
  await montrer(ailleurs);
  const vue = await lire(lea);
  assert.equal(vue.total, 1);
  assert.deepEqual(vue.presents[0], {
    personne: { id: sam.idPublic, pseudo: "miami.2", prenom: "", avatar: "🦀" }, dansTaBande: false, ambassadeur: false, nouveauDansLaVille: false,
    rescousses: 0, titreBadge: null, organise: null, enviesEnCommun: [], coucou: "aucun",
  });
  assert.equal(/latitude|longitude|position/.test(JSON.stringify(vue)), false);
  assert.equal((await lire(discret)).presents.length, 1);
  b.banc.rendrePotes(lea, sam);
  assert.equal((await lire(lea)).presents[0].dansTaBande, true);
  b.banc.horloge.maintenant += 3 * HEURE + 1000;
  assert.deepEqual((await lire(lea)).presents, []);
  assert.equal((await lire(sam)).jusqua, null);
  assert.equal((await lire(sam)).visible, true);
  b.banc.horloge.maintenant = Date.parse("2026-10-14T10:00:00Z");
});

test("coucou : rien ne se passe s'il n'est pas réciproque ; réciproque, l'autre est prévenu", async () => {
  const [lea, sam, nina] = [await b.banc.creerPersonne({ ville: "Lyon" }), await b.banc.creerPersonne({ ville: "Lyon" }), await b.banc.creerPersonne({ ville: "Lyon" })];
  await montrer(sam);
  assert.deepEqual((await coucou(lea, sam)).corps, { ok: false, erreur: "invisible-ici" });
  await montrer(lea);
  assert.equal((await coucou(lea, nina)).corps.erreur, "personne-inconnue", "pas là : personne-inconnue");
  assert.deepEqual((await coucou(lea, sam)).corps, { ok: true, coucou: "envoye" });
  assert.deepEqual(b.clocheDe(sam), []);
  assert.equal((await lire(sam)).presents.find((p: { personne: { id: string } }) => p.personne.id === lea.idPublic).coucou, "recu");
  assert.deepEqual((await coucou(sam, lea)).corps, { ok: true, coucou: "reciproque" });
  assert.deepEqual(b.clocheDe(lea), ["coucou-reciproque"]);
  await b.banc.attendreEnvois();
  assert.ok(b.banc.pushs.some((p) => p.compteId === lea.compteId && p.message.lien === "/potes/miamis/qui-est-la"));
  await coucou(sam, lea);
  assert.deepEqual(b.clocheDe(lea), ["coucou-reciproque"], "pas deux fois");
  assert.equal((await lire(lea)).presents[0].coucou, "reciproque");

  await montrer(sam, false);
  assert.deepEqual((await lire(lea)).presents, []);
  assert.equal(b.communaute.coucous.some((c) => c.deId === sam.compteId || c.aId === sam.compteId), false);
});

test("qui est là : blocages dans les deux sens, et compte limité (se montrer et faire coucou refusés, se cacher permis)", async () => {
  const [lea, sam, nina] = [await b.banc.creerPersonne({ ville: "Lille" }), await b.banc.creerPersonne({ ville: "Lille" }), await b.banc.creerPersonne({ ville: "Lille" })];
  for (const p of [lea, sam, nina]) await montrer(p);
  b.banc.bloquer(sam, lea);
  assert.deepEqual((await lire(lea)).presents.map((p: { personne: { id: string } }) => p.personne.id), [nina.idPublic]);
  assert.deepEqual((await lire(sam)).presents.map((p: { personne: { id: string } }) => p.personne.id), [nina.idPublic]);
  assert.equal((await coucou(lea, sam)).statut, 404);
  b.limites.add(nina.compteId);
  assert.equal((await montrer(nina)).corps.erreur, "compte-limite");
  assert.equal((await coucou(nina, lea)).corps.erreur, "compte-limite");
  assert.equal((await montrer(nina, false)).statut, 200);
  b.limites.clear();
});
