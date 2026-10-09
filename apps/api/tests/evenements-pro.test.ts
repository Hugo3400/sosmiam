// Tests des événements d'un lieu côté équipe (/pro/comptoir/lieux/:id/evenements) : rôles, validation, 10 à venir, lieu relu
// sur l'événement, modification, annulation et liste de l'équipe.
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";

import { creerBancEvenements, LIEU_TEST } from "./outils/creer-banc-evenements.ts";

let b: Awaited<ReturnType<typeof creerBancEvenements>>;
before(async () => { b = await creerBancEvenements(); });
after(() => b.fermer());
beforeEach(() => b.vider());

/** Un quiz le jeudi 15 octobre, de 20 h à 22 h (Paris) */
const QUIZ = {
  titre: "Quiz musical du jeudi", type: "quiz", description: "Viens avec ta bande, on fournit les buzzers.",
  debut: "2026-10-15T18:00:00.000Z", fin: "2026-10-15T20:00:00.000Z", hebdoJusqua: null,
  tarif: "gratuit", prixCentimes: null, places: null, alcool: false,
};
const CHEMIN = "/pro/comptoir/lieux/1/evenements";

async function equipe() {
  const gerant = await b.creerCompte({ prenom: "Max" });
  b.rattacher(gerant.id, 1, "gerant");
  const serveur = await b.creerCompte({ prenom: "Nina" });
  b.rattacher(serveur.id, 1, "equipe");
  return { gerant, serveur };
}

/** Un événement du lieu 1, le `jour` d'octobre à 20 h (Paris) */
const le = (jour: number, enPlus: Record<string, unknown> = {}) => ({
  ...QUIZ, debut: `2026-10-${String(jour).padStart(2, "0")}T18:00:00.000Z`, fin: null, ...enPlus,
});

test("publier : le gérant et l'équipe, 201, nettoyé, avec qui l'a publié", async () => {
  const { serveur, gerant } = await equipe();
  const r = await b.demander("POST", CHEMIN, serveur.jeton, { ...QUIZ, titre: "  Quiz   musical du jeudi ", tarif: "prix", prixCentimes: 500, places: 40 });
  assert.equal(r.statut, 201, JSON.stringify(r.corps));
  assert.equal(r.entetes.get("cache-control"), "private, no-store");
  assert.deepEqual(r.corps.evenement, {
    id: 1, titre: "Quiz musical du jeudi", type: "quiz", description: QUIZ.description, debut: QUIZ.debut, fin: QUIZ.fin, hebdoJusqua: null,
    tarif: "prix", prixCentimes: 500, places: 40, photo: null, alcool: false,
    prochaine: { debut: QUIZ.debut, fin: QUIZ.fin }, statut: "a-venir", annuleLe: null, suspendu: false, interesses: 0, publiePar: "Nina",
    creeLe: "2026-10-09T10:00:00.000Z", modifieLe: "2026-10-09T10:00:00.000Z",
  });
  assert.equal((await b.demander("POST", CHEMIN, gerant.jeton, le(16))).statut, 201);
  const liste = await b.demander("GET", CHEMIN, gerant.jeton);
  assert.deepEqual(liste.corps.evenements.map((e: { id: number }) => e.id), [1, 2]);
});

test("rôles : sans session 401, pas de l'équipe (ou d'un autre lieu) 403, adresse invalide 400", async () => {
  await equipe();
  const intrus = await b.creerCompte();
  const autreLieu = await b.creerCompte();
  b.rattacher(autreLieu.id, 2, "gerant");
  assert.equal((await b.demander("POST", CHEMIN, undefined, QUIZ)).statut, 401);
  for (const compte of [intrus, autreLieu]) {
    for (const [methode, chemin] of [["GET", CHEMIN], ["POST", CHEMIN], ["PUT", `${CHEMIN}/1`], ["DELETE", `${CHEMIN}/1`]]) {
      const r = await b.demander(methode, chemin, compte.jeton, methode === "GET" ? undefined : QUIZ);
      assert.deepEqual([r.statut, r.corps.erreur], [403, "role-requis"], `${methode} ${chemin}`);
    }
  }
  assert.equal((await b.demander("GET", "/pro/comptoir/lieux/abc/evenements", intrus.jeton)).corps.champ, "id");
});

test("validation : 400 evenement-invalide avec le champ à corriger", async () => {
  const { serveur } = await equipe();
  const champ = async (enPlus: Record<string, unknown>) => {
    const r = await b.demander("POST", CHEMIN, serveur.jeton, { ...QUIZ, ...enPlus });
    assert.equal(r.statut, 400, JSON.stringify(r.corps));
    assert.equal(r.corps.erreur, "evenement-invalide");
    return r.corps.champ;
  };
  assert.equal(await champ({ titre: "Quiz des connards" }), "titre");
  assert.equal(await champ({ type: "rave" }), "type");
  assert.equal(await champ({ debut: "2026-10-09T09:00:00Z" }), "debut");
  assert.equal(await champ({ debut: "2027-01-15T18:00:00Z", fin: null }), "debut");
  assert.equal(await champ({ hebdoJusqua: "2027-02-01T00:00:00Z" }), "hebdoJusqua");
  assert.equal(await champ({ tarif: "prix" }), "prixCentimes");
  assert.equal(await champ({ titre: "Soirée dégustation", description: "Vins à volonté !" }), "description");
  assert.equal(b.evenements.evenements.length, 0);
});

test("10 à venir par lieu : 409 au-delà ; un annulé ou un passé libère une place, un suspendu non", async () => {
  const { gerant } = await equipe();
  for (let jour = 10; jour < 20; jour++) assert.equal((await b.demander("POST", CHEMIN, gerant.jeton, le(jour))).statut, 201);
  const trop = await b.demander("POST", CHEMIN, gerant.jeton, le(25));
  assert.deepEqual([trop.statut, trop.corps.erreur], [409, "trop-d-evenements"]);
  // Un autre lieu a ses propres 10
  const autre = await b.creerCompte();
  b.rattacher(autre.id, 2, "gerant");
  assert.equal((await b.demander("POST", "/pro/comptoir/lieux/2/evenements", autre.jeton, le(25))).statut, 201);
  // Suspendu par la modération : compte toujours
  b.evenements.evenements[0]!.suspendu = true;
  assert.equal((await b.demander("POST", CHEMIN, gerant.jeton, le(25))).statut, 409);
  // Annulé : une place se libère
  assert.equal((await b.demander("DELETE", `${CHEMIN}/2`, gerant.jeton)).statut, 200);
  assert.equal((await b.demander("POST", CHEMIN, gerant.jeton, le(25))).statut, 201);
  assert.equal((await b.demander("POST", CHEMIN, gerant.jeton, le(26))).statut, 409);
  // Le 10 octobre à 23 h 01 (Paris) : le premier est fini (sans heure de fin, 3 h après son début)
  b.banc.horloge = Date.parse("2026-10-10T21:01:00Z");
  assert.equal((await b.demander("POST", CHEMIN, gerant.jeton, le(26))).statut, 201);
});

test("lieu relu sur l'événement : celui d'un autre lieu est introuvable", async () => {
  const { gerant } = await equipe();
  b.rattacher(gerant.id, 2, "gerant");
  b.evenements.lieux.set(2, { ...LIEU_TEST, id: 2, nom: "Le Comptoir" });
  assert.equal((await b.demander("POST", CHEMIN, gerant.jeton, QUIZ)).statut, 201);
  for (const methode of ["PUT", "DELETE"]) {
    const r = await b.demander(methode, "/pro/comptoir/lieux/2/evenements/1", gerant.jeton, { ...QUIZ, titre: "Piraté" });
    assert.deepEqual([r.statut, r.corps.erreur], [404, "evenement-inconnu"], methode);
  }
  assert.equal(b.evenements.evenements[0]!.titre, QUIZ.titre);
  assert.equal(b.evenements.evenements[0]!.annuleLe, null);
  assert.equal((await b.demander("PUT", `${CHEMIN}/99`, gerant.jeton, QUIZ)).corps.erreur, "evenement-inconnu");
  assert.equal((await b.demander("DELETE", `${CHEMIN}/zero`, gerant.jeton)).corps.champ, "evenementId");
});

test("modifier : en entier ; une série commencée garde son début ; passé 409, annulé 409", async () => {
  const { gerant, serveur } = await equipe();
  // Chaque jeudi du 15 octobre au 12 novembre
  await b.demander("POST", CHEMIN, gerant.jeton, { ...QUIZ, hebdoJusqua: "2026-11-12T22:00:00.000Z" });
  const r = await b.demander("PUT", `${CHEMIN}/1`, serveur.jeton, { ...QUIZ, titre: "Blind test du jeudi", hebdoJusqua: "2026-11-12T22:00:00.000Z" });
  assert.equal(r.statut, 200, JSON.stringify(r.corps));
  assert.deepEqual([r.corps.evenement.titre, r.corps.evenement.publiePar], ["Blind test du jeudi", "Max"]);
  // Le 23 octobre : la série a commencé, son début (passé) reste permis tel quel, pas un autre
  b.banc.horloge = Date.parse("2026-10-23T08:00:00Z");
  const garde = await b.demander("PUT", `${CHEMIN}/1`, serveur.jeton, { ...QUIZ, places: 30, hebdoJusqua: "2026-11-12T22:00:00.000Z" });
  assert.deepEqual([garde.statut, garde.corps.evenement.places, garde.corps.evenement.prochaine.debut], [200, 30, "2026-10-29T19:00:00.000Z"]);
  const autreDebut = await b.demander("PUT", `${CHEMIN}/1`, serveur.jeton, { ...QUIZ, debut: "2026-10-16T18:00:00.000Z", hebdoJusqua: "2026-11-12T22:00:00.000Z" });
  assert.equal(autreDebut.corps.champ, "debut");
  // Fini : plus modifiable
  b.banc.horloge = Date.parse("2026-11-13T08:00:00Z");
  assert.deepEqual((await b.demander("PUT", `${CHEMIN}/1`, serveur.jeton, QUIZ)).corps.erreur, "evenement-passe");
  // Annulé : plus modifiable non plus
  b.banc.horloge = Date.parse("2026-10-09T10:00:00Z");
  await b.demander("POST", CHEMIN, gerant.jeton, le(20));
  await b.demander("DELETE", `${CHEMIN}/2`, gerant.jeton);
  const annule = await b.demander("PUT", `${CHEMIN}/2`, gerant.jeton, le(21));
  assert.deepEqual([annule.statut, annule.corps.erreur], [409, "transition-interdite"]);
});

test("annuler : statut annulé, sans effet la deuxième fois, impossible une fois passé", async () => {
  const { gerant } = await equipe();
  await b.demander("POST", CHEMIN, gerant.jeton, QUIZ);
  const r = await b.demander("DELETE", `${CHEMIN}/1`, gerant.jeton);
  assert.deepEqual([r.statut, r.corps.evenement.statut, r.corps.evenement.annuleLe, r.corps.evenement.prochaine], [200, "annule", "2026-10-09T10:00:00.000Z", null]);
  b.banc.horloge += 60_000;
  assert.equal((await b.demander("DELETE", `${CHEMIN}/1`, gerant.jeton)).corps.evenement.annuleLe, "2026-10-09T10:00:00.000Z");
  await b.demander("POST", CHEMIN, gerant.jeton, le(12));
  b.banc.horloge = Date.parse("2026-10-13T08:00:00Z");
  const passe = await b.demander("DELETE", `${CHEMIN}/2`, gerant.jeton);
  assert.deepEqual([passe.statut, passe.corps.erreur], [409, "evenement-passe"]);
});

test("liste de l'équipe : à venir d'abord, puis finis ou annulés depuis 30 jours, intéressés comptés", async () => {
  const { gerant } = await equipe();
  await b.demander("POST", CHEMIN, gerant.jeton, le(10));
  await b.demander("POST", CHEMIN, gerant.jeton, le(30));
  await b.demander("POST", CHEMIN, gerant.jeton, { ...le(29), alcool: true });
  await b.demander("POST", CHEMIN, gerant.jeton, le(31));
  await b.demander("DELETE", `${CHEMIN}/4`, gerant.jeton);
  for (const id of [1, 2]) await b.evenements.services.poserInteret(gerant.id, id, false);
  const client = await b.creerCompte();
  await b.evenements.services.poserInteret(client.id, 2, true);
  // Le 20 octobre : le 10 est fini
  b.banc.horloge = Date.parse("2026-10-20T08:00:00Z");
  const liste = (await b.demander("GET", CHEMIN, gerant.jeton)).corps.evenements;
  assert.deepEqual(liste.map((e: { id: number; statut: string }) => [e.id, e.statut]), [[3, "a-venir"], [2, "a-venir"], [4, "annule"], [1, "passe"]]);
  assert.deepEqual(liste.map((e: { interesses: number }) => e.interesses), [0, 2, 0, 1]);
  assert.equal(liste[0].alcool, true);
  // Le 10 novembre à 21 h : le 10 octobre est fini depuis plus de 30 jours
  b.banc.horloge = Date.parse("2026-11-10T20:00:00Z");
  assert.deepEqual((await b.demander("GET", CHEMIN, gerant.jeton)).corps.evenements.map((e: { id: number }) => e.id), [4, 2, 3]);
});
