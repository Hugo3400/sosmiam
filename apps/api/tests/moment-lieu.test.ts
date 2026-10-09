// Tests du SOS « place ce soir » et du message du moment (/pro/comptoir/lieux/:id/moment, /sos, /message).
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";

import { creerBancVisites } from "./outils/creer-banc-visites.ts";

let b: Awaited<ReturnType<typeof creerBancVisites>>;
before(async () => { b = await creerBancVisites(); });
after(() => b.fermer());
beforeEach(() => b.vider());

async function equipe() {
  const gerant = await b.creerCompte({ prenom: "Max" });
  b.rattacher(gerant.id, 1, "gerant");
  const serveur = await b.creerCompte({ prenom: "Nina" });
  b.rattacher(serveur.id, 1, "equipe");
  return { gerant, serveur };
}

test("SOS : l'équipe le lance jusqu'à la fermeture, un par jour, arrêtable", async () => {
  const { serveur, gerant } = await equipe();
  // Vendredi 9 octobre, 12 h à Paris : le service du midi finit à 14 h 30
  const vide = (await b.demander("GET", "/pro/comptoir/lieux/1/moment", serveur.jeton)).corps.moment;
  assert.deepEqual(vide, { sos: null, sosPossible: true, fermeture: "2026-10-09T12:30:00.000Z", message: null });
  const r = await b.demander("POST", "/pro/comptoir/lieux/1/sos", serveur.jeton, { places: 6, offre: "  Un tiramisu   offert " });
  assert.equal(r.statut, 201, JSON.stringify(r.corps));
  assert.deepEqual(r.corps.moment.sos, {
    places: 6, offre: "Un tiramisu offert", jusqua: "2026-10-09T12:30:00.000Z", lanceLe: "2026-10-09T10:00:00.000Z", lancePar: "Nina", arreteLe: null, enCours: true,
  });
  assert.equal(r.corps.moment.sosPossible, false);
  assert.equal((await b.demander("POST", "/pro/comptoir/lieux/1/sos", gerant.jeton, { places: 3 })).corps.erreur, "sos-deja-lance");
  b.banc.horloge += 30 * 60_000;
  const arrete = (await b.demander("DELETE", "/pro/comptoir/lieux/1/sos", gerant.jeton)).corps.moment.sos;
  assert.deepEqual([arrete.enCours, arrete.arreteLe], [false, "2026-10-09T10:30:00.000Z"]);
  // Arrêté : pas de deuxième SOS le même jour ; le lendemain, si
  assert.equal((await b.demander("POST", "/pro/comptoir/lieux/1/sos", gerant.jeton, { places: 3 })).statut, 409);
  b.banc.horloge = Date.parse("2026-10-10T16:00:00Z");
  assert.equal((await b.demander("POST", "/pro/comptoir/lieux/1/sos", gerant.jeton, { places: 3 })).corps.moment.sos.jusqua, "2026-10-10T21:00:00.000Z");
});

test("SOS refusé : places, offre, fin, horaires inconnus, pas de l'équipe", async () => {
  const { serveur } = await equipe();
  const intrus = await b.creerCompte();
  const champ = async (corps: unknown) => (await b.demander("POST", "/pro/comptoir/lieux/1/sos", serveur.jeton, corps)).corps.champ;
  for (const places of [0, 31, 2.5, "4"]) assert.equal(await champ({ places }), "places", String(places));
  assert.equal(await champ({ places: 4, offre: "x".repeat(81) }), "offre");
  assert.equal(await champ({ places: 4, jusqua: "demain" }), "jusqua");
  // Après la fermeture (14 h 30) : refusé ; plus tôt : permis
  assert.equal(await champ({ places: 4, jusqua: "2026-10-09T13:00:00.000Z" }), "jusqua");
  assert.equal((await b.demander("POST", "/pro/comptoir/lieux/1/sos", intrus.jeton, { places: 4 })).corps.erreur, "role-requis");
  // Sans horaires : il faut dire jusqu'à quand, 4 h du matin au plus
  b.moment.lieux.get(1)!.ouverture = [];
  assert.equal(await champ({ places: 4 }), "jusqua");
  assert.equal(await champ({ places: 4, jusqua: "2026-10-10T03:00:00.000Z" }), "jusqua");
  const ok = await b.demander("POST", "/pro/comptoir/lieux/1/sos", serveur.jeton, { places: 4, jusqua: "2026-10-10T01:30:00.000Z" });
  assert.deepEqual([ok.statut, ok.corps.moment.fermeture, ok.corps.moment.sos.jusqua], [201, null, "2026-10-10T01:30:00.000Z"]);
});

test("message du moment : jusqu'à la fermeture par défaut, 24 h au plus, effacé", async () => {
  const { serveur } = await equipe();
  const pose = (await b.demander("PUT", "/pro/comptoir/lieux/1/message", serveur.jeton, { texte: "Happy hour jusqu'à 14 h" })).corps.moment.message;
  assert.deepEqual(pose, { texte: "Happy hour jusqu'à 14 h", jusqua: "2026-10-09T12:30:00.000Z" });
  assert.equal((await b.demander("PUT", "/pro/comptoir/lieux/1/message", serveur.jeton, { texte: "Salle calme", jusqua: "2026-10-10T11:00:00.000Z" })).corps.champ, "jusqua");
  assert.equal((await b.demander("PUT", "/pro/comptoir/lieux/1/message", serveur.jeton, { texte: " " })).corps.champ, "texte");
  assert.equal((await b.demander("PUT", "/pro/comptoir/lieux/1/message", serveur.jeton, { texte: "x".repeat(81) })).corps.champ, "texte");
  // Fini tout seul
  b.banc.horloge = Date.parse("2026-10-09T13:00:00Z");
  assert.equal((await b.demander("GET", "/pro/comptoir/lieux/1/moment", serveur.jeton)).corps.moment.message, null);
  await b.demander("PUT", "/pro/comptoir/lieux/1/message", serveur.jeton, { texte: "Salle calme ce soir" });
  assert.equal((await b.demander("DELETE", "/pro/comptoir/lieux/1/message", serveur.jeton)).corps.moment.message, null);
});
