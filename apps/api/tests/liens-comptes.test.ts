// Tests des liens envoyés par mail : « Mot de passe oublié » en libre-service (même réponse que l'adresse existe ou non,
// réponse qui n'attend pas le compte, limites par visiteur et par compte) et confirmation de l'e-mail (à l'inscription,
// lien de 7 jours à usage unique, renvoi limité). Services en mémoire : aucune base, aucun mail ne part.
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import { creerLimiteEnvois } from "../src/controleurs/comptes-limite-envois.ts";
import { calculerAttenteEnvoi } from "../src/fonctions/comptes/calculer-attente-envoi.ts";
import { calculerEmpreinteJeton } from "../src/fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../src/fonctions/securite/creer-jeton.ts";
import { hacherMotDePasse } from "../src/fonctions/securite/hacher-mot-de-passe.ts";
import { creerComptesEnMemoire } from "../src/services/comptes-en-memoire.ts";
import type { CompteConnecte } from "../src/services/comptes.ts";

const MINUTE = 60_000;
const UN_JOUR = 24 * 60 * MINUTE;
const MOT_DE_PASSE = "une petite phrase de passe";
let horloge = Date.parse("2026-10-09T10:00:00Z");
const memoire = creerComptesEnMemoire(() => horloge);
const dependances = { services: memoire.services, sessions: memoire.sessions, zones: memoire.zones, courriels: memoire.courriels, horloge: () => horloge };
const serveur = creerApplication({ enregistrerInscription: async () => {}, comptes: dependances }).listen(0, "127.0.0.1");
let adresse = "";
before(() => new Promise<void>((pret) => serveur.once("listening", () => {
  adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  pret();
})));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));

type Corps = { ok: boolean; erreur?: string; champ?: string; attente?: number; dejaVerifie?: boolean; session?: string; compte?: CompteConnecte };
let visiteur = 0;
async function demander(methode: string, chemin: string, { corps, jeton, ip = `visiteur-${++visiteur}`, base = adresse }: { corps?: unknown; jeton?: string; ip?: string; base?: string } = {}) {
  const reponse = await fetch(`${base}${chemin}`, {
    method: methode,
    headers: { "X-IP-Visiteur": ip, ...(corps === undefined ? {} : { "Content-Type": "application/json" }), ...(jeton ? { "X-Session-Compte": jeton } : {}) },
    ...(corps === undefined ? {} : { body: JSON.stringify(corps) }),
  });
  return { statut: reponse.status, corps: (await reponse.json()) as Corps, entetes: reponse.headers };
}
/** Le lien part après la réponse : on laisse aux tâches lancées sans attendre le temps de finir */
const laisserFinir = () => new Promise((fini) => setTimeout(fini, 30));
const jetonDuLien = (lien: string | undefined) => lien?.split("#jeton=")[1] ?? "";

const empreinte = await hacherMotDePasse(MOT_DE_PASSE);
let numero = 0;
async function creerCompte() {
  const email = `lien${++numero}@exemple.fr`;
  const id = await memoire.services.creerCompte({ email, motDePasse: empreinte, prenom: "Camille", ville: "Lyon", quartier: null, cguVersion: "2026-10-08" });
  if (id === null) throw new Error("compte de test impossible");
  const jeton = creerJeton();
  await memoire.sessions.creer(calculerEmpreinteJeton(jeton), { compteId: id, creeLe: horloge, activite: horloge });
  return { id, email, jeton };
}
const oublie = (email: unknown, ip?: string) => demander("POST", "/comptes/mot-de-passe-oublie", { corps: { email }, ip });
const envoisDe = (compteId: number, type: "mot-de-passe" | "verification-email") => memoire.envois.filter((envoi) => envoi.compteId === compteId && envoi.type === type);

test("attente entre deux liens : 15 minutes après le dernier, et 5 au plus sur 24 heures glissantes", () => {
  const t = Date.parse("2026-10-09T10:00:00Z");
  assert.equal(calculerAttenteEnvoi([], t), 0);
  assert.equal(calculerAttenteEnvoi([t], t), 15 * 60);
  assert.equal(calculerAttenteEnvoi([t - 14 * MINUTE], t), 60);
  assert.equal(calculerAttenteEnvoi([t - 15 * MINUTE], t), 0);
  const cinq = [0, 1, 2, 3, 4].map((i) => t - (4 - i) * 20 * MINUTE); // toutes les 20 minutes, la dernière à t
  assert.equal(calculerAttenteEnvoi(cinq, t + 20 * MINUTE), (UN_JOUR - 100 * MINUTE) / 1000, "le 6e attend que le 1er ait 24 heures");
  assert.equal(calculerAttenteEnvoi(cinq, cinq[0] + UN_JOUR), 0);
  assert.equal(calculerAttenteEnvoi([...cinq].reverse(), t + 20 * MINUTE), (UN_JOUR - 100 * MINUTE) / 1000, "dans n'importe quel ordre");
});

test("la limite des envois oublie un compte 24 heures après son dernier lien (ménage chaque minute)", (t) => {
  t.mock.timers.enable({ apis: ["setInterval"] });
  let maintenant = 0;
  const limite = creerLimiteEnvois(() => maintenant);
  limite.noterEnvoi("1");
  assert.equal(limite.lireAttente("1"), 900);
  maintenant = UN_JOUR - MINUTE;
  t.mock.timers.tick(60_000);
  assert.equal(limite.compterSuivis(), 1);
  maintenant = UN_JOUR;
  t.mock.timers.tick(60_000);
  assert.equal(limite.compterSuivis(), 0);
});

test("mot de passe oublié : la même réponse pour une adresse connue ou non ; un lien de 24 h seulement pour un compte", async () => {
  const { id, email } = await creerCompte();
  const connu = await oublie(` ${email.toUpperCase()} `);
  const inconnu = await oublie("personne@exemple.fr");
  assert.deepEqual([connu.statut, connu.corps], [200, { ok: true }]);
  assert.deepEqual([inconnu.statut, inconnu.corps], [200, { ok: true }]);
  assert.equal(connu.entetes.get("cache-control"), "private, no-store");
  await laisserFinir();
  const [envoi] = envoisDe(id, "mot-de-passe");
  assert.match(envoi?.lien ?? "", /^https:\/\/ambassadeur\.sosmiam\.fr\/nouveau-mot-de-passe#jeton=[A-Za-z0-9_-]{43}$/);
  assert.equal(envoi?.expireLe.getTime(), horloge + UN_JOUR);
  assert.equal(memoire.envois.filter((e) => e.type === "mot-de-passe").length, 1, "rien pour l'adresse inconnue");
  // La base ne garde que l'empreinte ; le lien marche une fois et ferme les sessions
  const jeton = jetonDuLien(envoi?.lien);
  assert.equal(memoire.comptes.get(id)?.reinitialisation?.empreinte, calculerEmpreinteJeton(jeton));
  assert.ok(!JSON.stringify([...memoire.comptes.values()]).includes(jeton));
  const nouveau = { jeton, motDePasse: "un tout nouveau mot de passe" };
  assert.deepEqual((await demander("POST", "/comptes/nouveau-mot-de-passe", { corps: nouveau })).corps, { ok: true });
  assert.equal((await demander("POST", "/comptes/nouveau-mot-de-passe", { corps: nouveau })).statut, 410);
  assert.equal((await demander("POST", "/comptes/session", { corps: { email, motDePasse: "un tout nouveau mot de passe" } })).statut, 201);
  // Une adresse mal formée : 400, comme les autres formulaires (ça ne dit rien d'un compte)
  assert.deepEqual((await oublie("pas-une-adresse")).corps, { ok: false, erreur: "champ-invalide", champ: "email" });
});

test("mot de passe oublié : la réponse part avant de chercher le compte (sa durée ne dit rien de l'adresse)", async () => {
  const lent = creerComptesEnMemoire(() => horloge);
  const id = await lent.services.creerCompte({ email: "lent@exemple.fr", motDePasse: empreinte, prenom: "Lou", ville: "Brest", quartier: null, cguVersion: "2026-10-08" });
  const services = { ...lent.services, trouverCompteParEmail: async (email: string) => (await new Promise((fini) => setTimeout(fini, 400)), lent.services.trouverCompteParEmail(email)) };
  const autre = creerApplication({ enregistrerInscription: async () => {}, comptes: { ...dependances, services, sessions: lent.sessions, courriels: lent.courriels } }).listen(0, "127.0.0.1");
  await new Promise<void>((pret) => autre.once("listening", () => pret()));
  const base = `http://127.0.0.1:${(autre.address() as AddressInfo).port}`;
  for (const email of ["lent@exemple.fr", "inconnu@exemple.fr"]) {
    const debut = performance.now();
    assert.deepEqual((await demander("POST", "/comptes/mot-de-passe-oublie", { corps: { email }, base })).corps, { ok: true });
    assert.ok(performance.now() - debut < 200, `${email} : réponse sans attendre la recherche du compte`);
  }
  assert.equal(lent.envois.length, 0);
  await new Promise((fini) => setTimeout(fini, 500));
  assert.deepEqual(lent.envois.map((envoi) => envoi.compteId), [id], "le lien part ensuite");
  await new Promise<void>((fini) => autre.close(() => fini()));
});

test("mot de passe oublié : 1 lien toutes les 15 minutes et 5 par 24 heures par compte ; au-delà rien ne part, réponse identique", async () => {
  const { id, email } = await creerCompte();
  const depart = horloge;
  for (let i = 0; i < 3; i++) assert.deepEqual((await oublie(email)).corps, { ok: true });
  await laisserFinir();
  assert.equal(envoisDe(id, "mot-de-passe").length, 1, "un seul lien malgré 3 demandes");
  for (let i = 1; i < 5; i++) {
    horloge += 15 * MINUTE;
    await oublie(email);
    await laisserFinir();
  }
  assert.equal(envoisDe(id, "mot-de-passe").length, 5);
  horloge += 15 * MINUTE;
  assert.deepEqual((await oublie(email)).corps, { ok: true });
  await laisserFinir();
  assert.equal(envoisDe(id, "mot-de-passe").length, 5, "le 6e en 24 heures ne part pas");
  horloge = depart + UN_JOUR;
  await oublie(email);
  await laisserFinir();
  assert.equal(envoisDe(id, "mot-de-passe").length, 6, "24 heures après le premier, un nouveau lien part");
  // Un envoi raté (mail mal réglé) ne change pas la réponse
  memoire.reglagesEnvoi.echecs = true;
  horloge += UN_JOUR;
  assert.deepEqual((await oublie(email)).corps, { ok: true });
  await laisserFinir();
  memoire.reglagesEnvoi.echecs = false;
});

test("mot de passe oublié : 5 demandes par visiteur et par heure, puis 429", async () => {
  for (let i = 0; i < 5; i++) assert.equal((await oublie(`essai${i}@exemple.fr`, "curieux")).statut, 200);
  const trop = await oublie("essai@exemple.fr", "curieux");
  assert.deepEqual([trop.statut, trop.corps], [429, { ok: false, erreur: "trop-de-demandes" }]);
  assert.ok(Number(trop.entetes.get("retry-after")) > 0);
});

test("inscription : un lien de confirmation de 7 jours part ; il confirme l'e-mail une seule fois", async () => {
  const inscription = await demander("POST", "/comptes", {
    corps: { email: "nouveau@exemple.fr", motDePasse: "mon chat adore les croissants", prenom: "Zoé", ville: "Nantes", dateNaissance: "2000-01-31", cgu: true },
  });
  assert.equal(inscription.statut, 201);
  assert.equal(inscription.corps.compte?.emailVerifie, false);
  await laisserFinir();
  const compte = [...memoire.comptes.values()].find((c) => c.email === "nouveau@exemple.fr");
  const [envoi] = envoisDe(compte?.id ?? 0, "verification-email");
  assert.match(envoi?.lien ?? "", /^https:\/\/ambassadeur\.sosmiam\.fr\/verifier-email#jeton=[A-Za-z0-9_-]{43}$/);
  assert.equal(envoi?.expireLe.getTime(), horloge + 7 * UN_JOUR);
  const jeton = jetonDuLien(envoi?.lien);
  assert.equal(compte?.verification?.empreinte, calculerEmpreinteJeton(jeton), "seulement l'empreinte");
  const verifier = (valeur: unknown) => demander("POST", "/comptes/verifier-email", { corps: { jeton: valeur } });
  for (const faux of ["", 42, "trop-court", creerJeton()]) assert.deepEqual((await verifier(faux)).corps, { ok: false, erreur: "jeton-invalide" });
  const bon = await verifier(jeton);
  assert.deepEqual([bon.statut, bon.corps], [200, { ok: true }]);
  assert.equal(compte?.emailVerifieLe, horloge);
  assert.equal(compte?.verification, null, "jeton effacé");
  assert.equal((await verifier(jeton)).statut, 400, "une seule fois");
  const session = await demander("GET", "/comptes/session", { jeton: inscription.corps.session });
  assert.equal(session.corps.compte?.emailVerifie, true);
  const renvoi = await demander("POST", "/comptes/moi/renvoyer-verification", { jeton: inscription.corps.session });
  assert.deepEqual(renvoi.corps, { ok: true, dejaVerifie: true });
});

test("un lien de confirmation expiré (7 jours) ne marche plus ; le renvoi est limité, l'envoi de l'inscription compris", async () => {
  const { id, jeton: session } = await creerCompte();
  const renvoyer = () => demander("POST", "/comptes/moi/renvoyer-verification", { jeton: session });
  assert.equal((await demander("POST", "/comptes/moi/renvoyer-verification")).statut, 401);
  assert.deepEqual((await renvoyer()).corps, { ok: true, dejaVerifie: false });
  await laisserFinir();
  const ancien = jetonDuLien(envoisDe(id, "verification-email")[0]?.lien);
  const tropTot = await renvoyer();
  assert.deepEqual([tropTot.statut, tropTot.corps], [429, { ok: false, erreur: "trop-de-demandes", attente: 900 }]);
  assert.equal(tropTot.entetes.get("retry-after"), "900");
  horloge += 15 * MINUTE;
  assert.equal((await renvoyer()).statut, 200);
  await laisserFinir();
  const envois = envoisDe(id, "verification-email");
  assert.equal(envois.length, 2);
  assert.equal((await demander("POST", "/comptes/verifier-email", { corps: { jeton: ancien } })).statut, 400, "un nouveau lien remplace l'ancien");
  const dernier = jetonDuLien(envois[1]?.lien);
  horloge += 7 * UN_JOUR;
  assert.deepEqual((await demander("POST", "/comptes/verifier-email", { corps: { jeton: dernier } })).corps, { ok: false, erreur: "jeton-invalide" });
  assert.equal(memoire.comptes.get(id)?.emailVerifieLe, null);
  // 5 par 24 heures (les deux d'avant ont plus de 24 heures)
  for (let i = 0; i < 5; i++) {
    horloge += 15 * MINUTE;
    assert.equal((await renvoyer()).statut, 200);
  }
  horloge += 15 * MINUTE;
  const sixieme = await renvoyer();
  assert.equal(sixieme.statut, 429);
  assert.ok((sixieme.corps.attente ?? 0) > 15 * 60, "il faut attendre que le premier ait 24 heures");
});
