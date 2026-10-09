// Tests de « Proposer une modification » d'une fiche de lieu (POST /comptes/moi/suggestions) : session obligatoire pour
// tout compte, vérification par validerPropositionLieu de packages/commun, lieu publié, champs inchangés retirés, « avant »
// tiré de la fiche, limites par compte et par visiteur. Services en mémoire : aucune base de données n'est touchée.
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import { calculerEmpreinteJeton } from "../src/fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../src/fonctions/securite/creer-jeton.ts";
import { retirerChampsInchanges } from "../src/fonctions/suggestions/retirer-champs-inchanges.ts";
import { LIMITE_SUGGESTIONS } from "../src/routes/comptes.ts";
import { creerComptesEnMemoire } from "../src/services/comptes-en-memoire.ts";
import type { LieuEnMemoire } from "../src/services/suggestions-comptes-en-memoire.ts";

let horloge = Date.parse("2026-10-09T10:00:00Z");
const memoire = creerComptesEnMemoire(() => horloge);
const serveur = creerApplication({
  enregistrerInscription: async () => {},
  comptes: { services: memoire.services, sessions: memoire.sessions, zones: memoire.zones, courriels: memoire.courriels, horloge: () => horloge },
}).listen(0, "127.0.0.1");
let adresse = "";
before(() => new Promise<void>((pret) => serveur.once("listening", () => {
  adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  pret();
})));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));

type Corps = { ok: boolean; erreur?: string; champ?: string; id?: number };
let visiteur = 0;
async function proposer(corps: unknown, jeton?: string, ip = `visiteur-${++visiteur}`) {
  const reponse = await fetch(`${adresse}/comptes/moi/suggestions`, {
    method: "POST",
    headers: { "X-IP-Visiteur": ip, "Content-Type": "application/json", ...(jeton ? { "X-Session-Compte": jeton } : {}) },
    body: JSON.stringify(corps),
  });
  return { statut: reponse.status, corps: (await reponse.json()) as Corps };
}

let numero = 0;
/** Un compte (sans fiche d'ambassadeur : un simple client) et une session ouverte pour lui */
async function creerClient() {
  const id = await memoire.services.creerCompte({
    email: `client${++numero}@exemple.fr`, motDePasse: "empreinte", prenom: "Léa", ville: "Montpellier", quartier: null, cguVersion: "2026-10-08",
  });
  if (id === null) throw new Error("compte de test impossible");
  const compte = memoire.comptes.get(id);
  if (compte) compte.statutAmbassadeur = null;
  const jeton = creerJeton();
  await memoire.sessions.creer(calculerEmpreinteJeton(jeton), { compteId: id, creeLe: horloge, activite: horloge });
  return { id, jeton };
}

const FICHE: LieuEnMemoire = {
  statut: "publie", nom: "Chez Léa", adresse: "3 rue de la Loge, Montpellier", horaires: "Mar–sam, 12h–14h30", texte: "Des pâtes fraîches.",
  telephone: "04 67 12 34 56", siteWeb: "https://chezlea.fr", instagram: "chezlea", animaux: null, accessible: true, terrasse: null,
  wifi: null, enfants: null, parking: null, paiements: ["especes", "cb"], reservation: null,
};
memoire.lieux.set(1, structuredClone(FICHE));
memoire.lieux.set(2, { ...structuredClone(FICHE), nom: "Le Brouillon", statut: "brouillon" });
for (let id = 10; id < 25; id++) memoire.lieux.set(id, { ...structuredClone(FICHE), nom: `Lieu ${id}` });

test("sans session : 401, rien n'est gardé", async () => {
  const { statut } = await proposer({ lieuId: 1, proposition: { horaires: "Tous les jours, 12h–23h" } });
  assert.equal(statut, 401);
  assert.equal(memoire.suggestions.length, 0);
});

test("un client propose : seuls les champs qui changent sont gardés, avec « avant » tiré de la fiche", async () => {
  const { id: compteId, jeton } = await creerClient();
  const { statut, corps } = await proposer({
    lieuId: 1,
    proposition: {
      nom: "  Chez Léa ", horaires: "Tous les jours, 12h–23h", telephone: "0467123456", siteWeb: "https://chezlea.fr/",
      paiements: ["cb", "especes"], accessible: true, wifi: false, animaux: "bienvenus",
    },
    message: "Ils ouvrent aussi le soir maintenant !",
  }, jeton);
  assert.equal(statut, 201);
  assert.equal(corps.ok, true);
  const gardee = memoire.suggestions.find((s) => s.id === corps.id);
  assert.ok(gardee);
  assert.deepEqual(gardee.proposition, { horaires: "Tous les jours, 12h–23h", wifi: false, animaux: "bienvenus" });
  assert.deepEqual(gardee.avant, { horaires: "Mar–sam, 12h–14h30", wifi: null, animaux: null });
  assert.equal(gardee.message, "Ils ouvrent aussi le soir maintenant !");
  assert.equal(gardee.source, "client");
  assert.equal(gardee.statut, "en-attente");
  assert.equal(gardee.compteId, compteId);
  assert.equal(gardee.lieuId, 1);
});

test("proposition invalide : 400 avec le champ de validerPropositionLieu", async () => {
  const { jeton } = await creerClient();
  const essais: [unknown, string][] = [
    [{ lieuId: 1 }, "vide"],
    [{ lieuId: 1, proposition: {} }, "vide"],
    [{ lieuId: 1, proposition: { nom: "" } }, "nom"],
    [{ lieuId: 1, proposition: { telephone: "pas un numéro" } }, "telephone"],
    [{ lieuId: 1, proposition: { siteWeb: "http://chezlea.fr" } }, "siteWeb"],
    [{ lieuId: 1, proposition: { animaux: "chats" } }, "autre"],
    [{ lieuId: 1, proposition: { horaires: "12h–23h" }, message: 42 }, "message"],
    // Champs qui ne sont pas proposables (pas dans PropositionLieu, ou pas une colonne de Lieu) : refusés, pas oubliés
    [{ lieuId: 1, proposition: { horaires: "12h–23h", prix: "€€€" } }, "autre"],
    [{ lieuId: 1, proposition: { horaires: "12h–23h", statut: "masque" } }, "autre"],
  ];
  for (const [corps, champ] of essais) {
    const reponse = await proposer(corps, jeton);
    assert.equal(reponse.statut, 400, JSON.stringify(corps));
    assert.deepEqual(reponse.corps, { ok: false, erreur: "proposition-invalide", champ }, JSON.stringify(corps));
  }
});

test("lieu absent, pas publié ou mal écrit : 404 lieu-inconnu", async () => {
  const { jeton } = await creerClient();
  for (const lieuId of [999, 2, "1", -1, 1.5, null, undefined]) {
    const { statut, corps } = await proposer({ lieuId, proposition: { horaires: "Tous les jours" } }, jeton);
    assert.equal(statut, 404, String(lieuId));
    assert.equal(corps.erreur, "lieu-inconnu");
  }
});

test("rien de nouveau : 400 rien-a-changer", async () => {
  const { jeton } = await creerClient();
  const { statut, corps } = await proposer({ lieuId: 1, proposition: { nom: "Chez Léa", paiements: ["cb", "especes"], telephone: "+33 4 67 12 34 56" } }, jeton);
  assert.equal(statut, 400);
  assert.equal(corps.erreur, "rien-a-changer");
});

test("limites par compte : 3 en attente sur un même lieu, puis 10 par 24 heures", async () => {
  const { jeton } = await creerClient();
  for (let i = 0; i < 3; i++) assert.equal((await proposer({ lieuId: 10, proposition: { horaires: `Horaires ${i}` } }, jeton)).statut, 201);
  const quatrieme = await proposer({ lieuId: 10, proposition: { horaires: "Encore" } }, jeton);
  assert.equal(quatrieme.statut, 409);
  assert.equal(quatrieme.corps.erreur, "trop-de-suggestions");
  // Sur d'autres lieux, ça passe… jusqu'à 10 dans la journée
  for (let id = 11; id < 18; id++) assert.equal((await proposer({ lieuId: id, proposition: { wifi: true } }, jeton)).statut, 201);
  assert.equal((await proposer({ lieuId: 18, proposition: { wifi: true } }, jeton)).statut, 409);
  // Un autre compte n'est pas bloqué
  assert.equal((await proposer({ lieuId: 18, proposition: { wifi: true } }, (await creerClient()).jeton)).statut, 201);
  // 24 heures plus tard, de nouveau possible (sauf sur le lieu où 3 attentent toujours)
  horloge += 24 * 3600_000 + 1000;
  const memeCompte = [...memoire.sessions_jetons_pour_test()];
  void memeCompte;
});
