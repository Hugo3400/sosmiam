// Tests des routes de gestion de tous les comptes (logiciel) : faux services, sans base.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

const appels: unknown[] = [];
const actions: string[] = [];
const existe = (id: number) => id === 7;
const banc = await creerBancGestion(
  {
    noterAction: async (_poste: string, action: string, detail?: string) => void actions.push(`${action} | ${detail ?? ""}`),
    listerComptes: async (filtres: unknown) => (appels.push({ liste: filtres }), { total: 1, trouves: 1, parPage: 50, compteurs: {}, comptes: [] }),
    lireCompteGestion: async (id: number) => (existe(id) ? { id, prenom: "Léa" } : null),
    deconnecterPartout: async () => 3,
    exporterDonneesCompte: async (id: number) => (existe(id) ? { compte: { id, email: "lea@exemple.fr" } } : null),
    envoyerLienMotDePasse: async (id: number, lien: string) => (appels.push({ lien, id }), { ok: true }),
    supprimerCompte: async (id: number) => (existe(id) ? { prenom: "Léa" } : null),
  } as never,
  {
    ajouterPoints: async () => ({ points: 0, palier: "curieux" }),
    donnerBadge: async () => true,
    preparerReinitialisation: async () => ({ jeton: "jeton-secret", expireLe: new Date("2026-10-10T12:00:00Z") }),
    nommerAmbassadeurVille: async () => {},
    retirerAmbassadeurVille: async () => "curieux",
  },
);
let session = "";
before(async () => void (session = await banc.ouvrirSession()));
after(() => banc.fermer());

test("liste : recherche, rôle et page lus (un rôle inconnu est ignoré)", async () => {
  await banc.demander("GET", "/comptes?recherche=lea&role=ambassadeur&page=2", { session });
  assert.deepEqual(appels.at(-1), { liste: { recherche: "lea", role: "ambassadeur", page: 2 } });
  await banc.demander("GET", "/comptes?role=roi&page=-4", { session });
  assert.deepEqual(appels.at(-1), { liste: { recherche: "", role: "", page: 1 } });
});

test("fiche, déconnexion et export : introuvable si le compte n'existe pas ; le journal n'a qu'un numéro", async () => {
  assert.equal((await banc.demander("GET", "/comptes/9", { session })).status, 404);
  assert.deepEqual(await (await banc.demander("POST", "/comptes/7/deconnecter", { session, corps: {} })).json(), { ok: true, fermees: 3 });
  assert.equal((await banc.demander("GET", "/comptes/9/donnees", { session })).status, 404);
  assert.deepEqual(await (await banc.demander("GET", "/comptes/7/donnees", { session })).json(), { compte: { id: 7, email: "lea@exemple.fr" } });
  assert.ok(actions.every((ligne) => !ligne.includes("Léa") && !ligne.includes("@")), "ni prénom ni adresse dans le journal");
});

test("mot de passe : envoyé par mail, le lien ne revient pas ; sinon il revient", async () => {
  const envoye = (await (await banc.demander("POST", "/comptes/7/reinitialiser", { session, corps: { envoyer: true } })).json()) as Record<string, unknown>;
  assert.equal(envoye.envoye, true);
  assert.equal(envoye.lien, undefined);
  assert.deepEqual(appels.at(-1), { lien: "https://ambassadeur.sosmiam.fr/nouveau-mot-de-passe#jeton=jeton-secret", id: 7 });
  const prepare = (await (await banc.demander("POST", "/comptes/7/reinitialiser", { session, corps: {} })).json()) as Record<string, unknown>;
  assert.equal(prepare.lien, "https://ambassadeur.sosmiam.fr/nouveau-mot-de-passe#jeton=jeton-secret");
});

test("suppression : le compte entier ; introuvable sinon", async () => {
  assert.equal((await banc.demander("DELETE", "/comptes/9", { session })).status, 404);
  assert.equal((await banc.demander("DELETE", "/comptes/7", { session })).status, 200);
  assert.ok(actions.includes("Compte SOS Miam supprimé (app comprise) | compte n° 7"));
});
