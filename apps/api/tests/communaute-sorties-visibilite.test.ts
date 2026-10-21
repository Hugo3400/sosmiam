import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { creerBancCommunaute, HEURE, JOUR } from "./outils/creer-banc-communaute.ts";
import type { PersonneDeTest } from "./outils/creer-banc-social.ts";

let b: Awaited<ReturnType<typeof creerBancCommunaute>>;
before(async () => {
  b = await creerBancCommunaute();
});
after(() => b.banc.fermer());

const lire = (p: PersonneDeTest, id: string) => p.demander("GET", `/app/communaute/sorties/${id}`);
const demenager = (p: PersonneDeTest, ville: string) => Object.assign(b.banc.tables.comptes.get(p.compteId)!, { villeApp: ville });

async function sortieAvecPresente(orga: PersonneDeTest, lea: PersonneDeTest) {
  const lieu = b.lieu({ ville: "Lyon" });
  const s = (await b.organiser(orga, b.nouvelleSortie(lieu, { quand: b.iso(2 * JOUR) }))).corps.sortie;
  await lea.demander("POST", `/app/communaute/sorties/${s.id}/demande`);
  await orga.demander("POST", `/app/communaute/sorties/${s.id}/demandes/${lea.idPublic}`);
  return { s, lieu };
}

test("par son numéro, une sortie ne se lit que comme dans la liste : sa ville, à venir, son public", async () => {
  const [orga, lea, voisine] = await Promise.all(["Orga", "Léa", "Voisine"].map((prenom) => b.banc.creerPersonne({ prenom, ville: "Lyon" })));
  const brestois = await b.banc.creerPersonne({ prenom: "Curieux", ville: "Brest" });
  const { s } = await sortieAvecPresente(orga, lea);

  const vueVoisine = await lire(voisine, s.id);
  assert.equal(vueVoisine.statut, 200, "même ville, à venir : comme dans la liste");
  assert.ok(vueVoisine.corps.sortie.participants.every((p: { present: boolean }) => p.present === false));
  assert.equal((await lire(brestois, s.id)).statut, 404, "une autre ville : 404");
  const demande = await brestois.demander("POST", `/app/communaute/sorties/${s.id}/demande`);
  assert.deepEqual([demande.statut, demande.corps.erreur], [404, "sortie-inconnue"], "ni lue, ni demandée depuis une autre ville");
  assert.equal((await brestois.demander("GET", "/app/communaute/sorties")).corps.sorties.some((x: { id: string }) => x.id === s.id), false);
});

test("après la sortie, seuls l'organisateur et les acceptés gardent leur historique, présences comprises", async () => {
  const [orga, lea, voisine] = await Promise.all(["Orga", "Léa", "Voisine"].map((prenom) => b.banc.creerPersonne({ prenom, ville: "Lyon" })));
  const { s, lieu } = await sortieAvecPresente(orga, lea);
  const avant = b.banc.horloge.maintenant;
  try {
    b.banc.horloge.maintenant = Date.parse(s.quand) + 30 * 60_000;
    b.communaute.visites.push({ compteId: lea.compteId, lieuId: lieu, statut: "validee", creeLe: new Date(b.banc.horloge.maintenant), valideLe: new Date(b.banc.horloge.maintenant) });
    assert.equal((await lea.demander("POST", `/app/communaute/sorties/${s.id}/presence`)).statut, 200);
    assert.equal((await lire(voisine, s.id)).statut, 404, "commencée : plus lisible par qui n'y est pas");

    b.banc.horloge.maintenant += 20 * JOUR;
    for (const p of [orga, lea]) {
      const vue = await lire(p, s.id);
      assert.equal(vue.statut, 200, "l'historique reste");
      assert.equal(vue.corps.sortie.participants.find((x: { personne: { id: string } }) => x.personne.id === lea.idPublic)?.present, true);
    }
    demenager(lea, "Brest");
    assert.equal((await lire(lea, s.id)).statut, 200, "même après un déménagement");
    for (let id = 1; id <= Number(s.id) + 3; id++) assert.equal((await lire(voisine, String(id))).statut, 404, `sortie ${id} : rien en parcourant les numéros`);
  } finally {
    b.banc.horloge.maintenant = avant;
  }
});

test("refusé, retiré, désisté : la vue publique avant la sortie (refus toujours silencieux), 404 ensuite", async () => {
  const [orga, sam, nina, tom, ines] = await Promise.all(["Orga", "Sam", "Nina", "Tom", "Inès"].map((prenom) => b.banc.creerPersonne({ prenom, ville: "Lyon" })));
  const lieu = b.lieu({ ville: "Lyon" });
  const s = (await b.organiser(orga, b.nouvelleSortie(lieu, { quand: b.iso(2 * JOUR) }))).corps.sortie;
  for (const p of [sam, nina, tom, ines]) await p.demander("POST", `/app/communaute/sorties/${s.id}/demande`);
  await orga.demander("DELETE", `/app/communaute/sorties/${s.id}/demandes/${sam.idPublic}`);
  for (const p of [nina, tom]) await orga.demander("POST", `/app/communaute/sorties/${s.id}/demandes/${p.idPublic}`);
  assert.equal((await orga.demander("DELETE", `/app/communaute/sorties/${s.id}/participants/${nina.idPublic}`)).statut, 200);
  const avant = b.banc.horloge.maintenant;
  try {
    for (const p of [sam, nina]) {
      const vue = await lire(p, s.id);
      assert.deepEqual([vue.statut, vue.corps.sortie.moi.place, vue.corps.sortie.conversationId], [200, "demande", null], "comme tout le monde, refus silencieux");
    }
    demenager(sam, "Brest");
    assert.equal((await lire(sam, s.id)).statut, 404, "un refus ne garde pas la sortie hors de la liste publique");
    assert.equal((await sam.demander("POST", `/app/communaute/sorties/${s.id}/demande`)).statut, 404, "redemander ne la rend pas non plus");
    demenager(sam, "Lyon");

    b.banc.horloge.maintenant = Date.parse(s.quand) - 2 * HEURE;
    const parti = await tom.demander("DELETE", `/app/communaute/sorties/${s.id}/participation`);
    assert.deepEqual([parti.statut, parti.corps.sortie.moi.place, parti.corps.sortie.conversationId], [200, "aucune", null], "désisté tard : la vue publique");

    b.banc.horloge.maintenant = Date.parse(s.quand) + 30 * 60_000;
    for (const p of [sam, nina, tom, ines]) assert.equal((await lire(p, s.id)).statut, 404, "après l'heure : 404 pour qui n'est pas venu, demande en cours comprise");
    assert.equal((await sam.demander("POST", `/app/communaute/sorties/${s.id}/demande`)).statut, 404);
    assert.equal((await nina.demander("DELETE", `/app/communaute/sorties/${s.id}/participation`)).statut, 404);
    assert.equal((await ines.demander("DELETE", `/app/communaute/sorties/${s.id}/demande`)).statut, 404);
    const liste = (await nina.demander("GET", "/app/communaute/sorties")).corps.sorties;
    assert.equal(liste.some((x: { id: string }) => x.id === s.id), false);
    assert.equal((await lire(orga, s.id)).statut, 200);
  } finally {
    b.banc.horloge.maintenant = avant;
  }
});

test("en attente ou demande en cours : lisible jusqu'à l'heure de la sortie, même après un déménagement", async () => {
  const [orga, lea, sam] = await Promise.all(["Orga", "Léa", "Sam"].map((prenom) => b.banc.creerPersonne({ prenom, ville: "Lyon" })));
  const s = (await b.organiser(orga, b.nouvelleSortie(b.lieu({ ville: "Lyon" }), { quand: b.iso(2 * JOUR), places: 2 }))).corps.sortie;
  await lea.demander("POST", `/app/communaute/sorties/${s.id}/demande`);
  await sam.demander("POST", `/app/communaute/sorties/${s.id}/demande`);
  await orga.demander("POST", `/app/communaute/sorties/${s.id}/demandes/${lea.idPublic}`);
  await orga.demander("POST", `/app/communaute/sorties/${s.id}/demandes/${sam.idPublic}`);
  const autre = await b.banc.creerPersonne({ prenom: "Nora", ville: "Lyon" });
  await autre.demander("POST", `/app/communaute/sorties/${s.id}/demande`);
  demenager(sam, "Brest");
  demenager(autre, "Brest");
  assert.equal((await lire(sam, s.id)).corps.sortie.moi.place, "attente");
  assert.equal((await lire(autre, s.id)).corps.sortie.moi.place, "demande");
});
