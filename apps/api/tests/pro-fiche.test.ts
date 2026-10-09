// Tests de « Ma fiche » (espace pro) : lecture par le gérant et par l'équipe, PATCH appliqué tout de suite (vérifié par
// la fonction commune, effacement possible), nom et adresse envoyés à l'équipe (suggestion « pro »), les suggestions sur
// le lieu sans leur auteur, et la fiche publique GET /lieux/publics/:id. Tout en mémoire : aucune base.
import assert from "node:assert/strict";
import { after, test } from "node:test";

import { creerBancPro, FICHE_TEST } from "./outils/creer-banc-pro.ts";

const { banc, memoire, demander, creerCompte, ajouterLieu, creerGerant, fermer } = await creerBancPro();
after(fermer);

test("le gérant lit sa fiche complète, sans la note de l'équipe ; estVerifie", async () => {
  const { jeton, lieuId } = await creerGerant();
  const { statut, corps } = await demander("GET", `/pro/lieux/${lieuId}`, { jeton });
  assert.equal(statut, 200);
  const { prix: _prix, couleurs: _couleurs, decouvertPar: _decouvert, ...attendu } = FICHE_TEST;
  assert.deepEqual(corps, { ok: true, role: "gerant", peutModifier: true, fiche: { id: lieuId, ...attendu, estVerifie: true } });
  assert.equal("note" in corps.fiche, false);
});

test("PATCH : appliqué tout de suite, normalisé ; seuls les champs qui changent sont annoncés", async () => {
  const { jeton, lieuId } = await creerGerant();
  const { statut, corps } = await demander("PATCH", `/pro/lieux/${lieuId}`, {
    jeton,
    corps: { horaires: "Tous les jours, 12h–23h", telephone: "+33465710001", instagram: "@chez.lea", wifi: true, terrasse: false, animaux: "terrasse", paiements: ["cb", "especes"] },
  });
  assert.equal(statut, 200);
  assert.deepEqual(corps.appliques.sort(), ["animaux", "horaires", "instagram", "terrasse", "wifi"]);
  assert.deepEqual([corps.envoyesAEquipe, corps.suggestionId], [[], null]);
  const lieu = memoire.lieux.get(lieuId);
  assert.deepEqual([lieu?.horaires, lieu?.instagram, lieu?.wifi, lieu?.terrasse, lieu?.animaux], ["Tous les jours, 12h–23h", "chez.lea", true, false, "terrasse"]);
  assert.equal(corps.fiche.horaires, "Tous les jours, 12h–23h");
  assert.equal(memoire.suggestions.filter((s) => s.lieuId === lieuId).length, 0, "pas de suggestion pour un champ direct");
});

test("PATCH : null ou vide EFFACE l'info (le pro peut, pas le client)", async () => {
  const { jeton, lieuId } = await creerGerant();
  const { corps } = await demander("PATCH", `/pro/lieux/${lieuId}`, { jeton, corps: { telephone: null, siteWeb: "", accessible: null, paiements: [], texte: "" } });
  assert.deepEqual(corps.appliques.sort(), ["accessible", "paiements", "siteWeb", "telephone", "texte"]);
  const lieu = memoire.lieux.get(lieuId);
  assert.deepEqual([lieu?.telephone, lieu?.siteWeb, lieu?.accessible, lieu?.paiements, lieu?.texte], [null, null, null, [], ""]);
});

test("PATCH : nom et adresse ne changent pas la fiche, ils partent à l'équipe (suggestion « pro »)", async () => {
  const { id: compteId, jeton, lieuId } = await creerGerant();
  const { statut, corps } = await demander("PATCH", `/pro/lieux/${lieuId}`, {
    jeton, corps: { nom: "Chez Léa & Max", adresse: "5 rue de la Loge", texte: "Pâtes fraîches et tiramisu.", message: "On a déménagé à côté." },
  });
  assert.equal(statut, 200);
  assert.deepEqual([corps.appliques, corps.envoyesAEquipe.sort()], [["texte"], ["adresse", "nom"]]);
  assert.equal(typeof corps.suggestionId, "number");
  assert.deepEqual([memoire.lieux.get(lieuId)?.nom, memoire.lieux.get(lieuId)?.adresse], ["Chez Léa", "3 rue de la Loge"]);
  const suggestion = memoire.suggestions.find((s) => s.id === corps.suggestionId);
  assert.deepEqual(
    [suggestion?.source, suggestion?.statut, suggestion?.compteId, suggestion?.proposition, suggestion?.avant, suggestion?.message],
    ["pro", "en-attente", compteId, { nom: "Chez Léa & Max", adresse: "5 rue de la Loge" }, { nom: "Chez Léa", adresse: "3 rue de la Loge" }, "On a déménagé à côté."],
  );
  // Nom inchangé : pas de suggestion
  const pareil = await demander("PATCH", `/pro/lieux/${lieuId}`, { jeton, corps: { nom: "Chez Léa" } });
  assert.deepEqual([pareil.statut, pareil.corps.appliques, pareil.corps.envoyesAEquipe, pareil.corps.suggestionId], [200, [], [], null]);
});

test("PATCH : trop de suggestions nom/adresse → 409 et RIEN n'est appliqué", async () => {
  const { jeton, lieuId } = await creerGerant();
  for (let i = 1; i <= 3; i++) assert.equal((await demander("PATCH", `/pro/lieux/${lieuId}`, { jeton, corps: { nom: `Chez Léa ${i}` } })).statut, 200);
  const refus = await demander("PATCH", `/pro/lieux/${lieuId}`, { jeton, corps: { nom: "Chez Léa 4", horaires: "Fermé le lundi" } });
  assert.deepEqual([refus.statut, refus.corps], [409, { ok: false, erreur: "trop-de-suggestions" }]);
  assert.equal(memoire.lieux.get(lieuId)?.horaires, "Mar–sam, 12h–14h30");
});

test("PATCH invalide : 400 proposition-invalide avec le champ, la fiche ne bouge pas", async () => {
  const { jeton, lieuId } = await creerGerant();
  const essais: [Record<string, unknown>, string][] = [
    [{}, "vide"], [{ prix: "€€€" }, "autre"], [{ statut: "masque" }, "autre"], [{ telephone: "pas un numéro", horaires: "Lundi" }, "telephone"],
    [{ siteWeb: "http://x.fr" }, "siteWeb"], [{ nom: "" }, "nom"], [{ adresse: null }, "adresse"], [{ reservation: "jamais" }, "autre"],
  ];
  for (const [corps, champ] of essais) {
    const reponse = await demander("PATCH", `/pro/lieux/${lieuId}`, { jeton, corps });
    assert.deepEqual([reponse.statut, reponse.corps], [400, { ok: false, erreur: "proposition-invalide", champ }], JSON.stringify(corps));
  }
  assert.deepEqual(memoire.lieux.get(lieuId), FICHE_TEST);
});

test("un membre « equipe » lit la fiche et les suggestions, mais ne modifie pas (403 reserve-au-gerant)", async () => {
  const gerant = await creerGerant();
  const employe = await creerCompte("Max");
  await demander("POST", `/pro/lieux/${gerant.lieuId}/equipe`, { jeton: gerant.jeton, corps: { email: employe.email } });
  const invitation = memoire.rattachements.find((r) => r.compteId === employe.id);
  assert.equal((await demander("GET", `/pro/lieux/${gerant.lieuId}`, { jeton: employe.jeton })).statut, 403, "pas encore acceptée");
  await demander("POST", `/comptes/moi/rattachements/${invitation?.id}/accepter`, { jeton: employe.jeton });
  const lecture = await demander("GET", `/pro/lieux/${gerant.lieuId}`, { jeton: employe.jeton });
  assert.deepEqual([lecture.statut, lecture.corps.role, lecture.corps.peutModifier], [200, "equipe", false]);
  assert.equal((await demander("GET", `/pro/lieux/${gerant.lieuId}/suggestions`, { jeton: employe.jeton })).statut, 200);
  const patch = await demander("PATCH", `/pro/lieux/${gerant.lieuId}`, { jeton: employe.jeton, corps: { horaires: "Fermé" } });
  assert.deepEqual([patch.statut, patch.corps], [403, { ok: false, erreur: "reserve-au-gerant" }]);
  assert.equal(memoire.lieux.get(gerant.lieuId)?.horaires, FICHE_TEST.horaires);
});

test("suggestions sur mon lieu : clients et pro, les plus récentes d'abord, SANS l'auteur client", async () => {
  const { jeton, lieuId } = await creerGerant();
  const client = await creerCompte("Camille");
  const envoi = await demander("POST", "/comptes/moi/suggestions", {
    jeton: client.jeton, corps: { lieuId, proposition: { horaires: "Ouvert le dimanche" }, message: "J'y étais dimanche, c'était ouvert !" },
  });
  assert.equal(envoi.statut, 201);
  const clientGardee = memoire.suggestions.find((s) => s.id === envoi.corps.id);
  if (clientGardee) Object.assign(clientGardee, { statut: "refusee", reponse: "Merci Camille !", decideLe: banc.horloge + 1000 });
  banc.horloge += 60_000;
  const pro = await demander("PATCH", `/pro/lieux/${lieuId}`, { jeton, corps: { adresse: "7 rue de la Loge" } });
  const { statut, corps } = await demander("GET", `/pro/lieux/${lieuId}/suggestions`, { jeton });
  assert.equal(statut, 200);
  assert.deepEqual(corps.suggestions, [
    {
      id: pro.corps.suggestionId, source: "pro", champs: ["adresse"], avant: { adresse: "3 rue de la Loge" }, proposition: { adresse: "7 rue de la Loge" },
      message: null, statut: "en-attente", champsAcceptes: [], reponse: null, creeLe: new Date(banc.horloge).toISOString(), decideLe: null,
    },
    {
      id: envoi.corps.id, source: "client", champs: ["horaires"], avant: { horaires: "Mar–sam, 12h–14h30" }, proposition: { horaires: "Ouvert le dimanche" },
      message: "J'y étais dimanche, c'était ouvert !", statut: "refusee", champsAcceptes: [], reponse: null,
      creeLe: new Date(banc.horloge - 60_000).toISOString(), decideLe: new Date(banc.horloge - 59_000).toISOString(),
    },
  ]);
  assert.equal(JSON.stringify(corps).includes(client.email), false);
  assert.equal(JSON.stringify(corps).includes("compteId"), false);
});

test("fiche publique : un lieu publié, avec estVerifie ; 404 sinon", async () => {
  const lieuId = ajouterLieu();
  const avant = await demander("GET", `/lieux/publics/${lieuId}`);
  assert.equal(avant.statut, 200);
  assert.equal(avant.entetes.get("cache-control"), "public, max-age=60");
  const { statut: _statut, ...fiche } = FICHE_TEST;
  assert.deepEqual(avant.corps, { ok: true, lieu: { id: lieuId, ...fiche, estVerifie: false, carte: null, carteMajLe: null } });
  await creerGerant(lieuId);
  assert.equal((await demander("GET", `/lieux/publics/${lieuId}`)).corps.lieu.estVerifie, true);
  for (const id of [ajouterLieu({ statut: "brouillon" }), ajouterLieu({ statut: "masque" }), 99_999, "abc", "0"]) {
    const { statut, corps } = await demander("GET", `/lieux/publics/${id}`);
    assert.deepEqual([statut, corps], [404, { ok: false, erreur: "lieu-inconnu" }], String(id));
  }
});
