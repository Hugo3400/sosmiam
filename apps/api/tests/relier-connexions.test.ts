// Tests de « Mes façons de me connecter » : relier Apple ou Google au compte connecté (POST /comptes/moi/connexions/…),
// le délier (DELETE /comptes/moi/connexions/:fournisseur), la dernière façon de se connecter, la confirmation, la limite
// par compte, et des journaux sans jeton, e-mail ni « sub ». Tout en mémoire, faux Apple et faux Google : aucune base,
// aucun appel réseau.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import type { AddressInfo } from "node:net";
import { after, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import { creerChiffrementDonnees } from "../src/services/chiffrement-donnees.ts";
import { creerComptesEnMemoire } from "../src/services/comptes-en-memoire.ts";
import { creerVerificateurApple, creerVerificateurGoogle } from "../src/services/connexion-externe.ts";
import { creerFauxFournisseur } from "./outils/creer-faux-fournisseur.ts";

const banc = { horloge: Date.parse("2026-10-14T10:00:00Z") };
const horloge = () => banc.horloge;
const memoire = creerComptesEnMemoire(horloge);
const apple = creerFauxFournisseur("apple", horloge);
const google = creerFauxFournisseur("google", horloge);
const serveur = creerApplication({
  enregistrerInscription: async () => {},
  comptes: {
    services: memoire.services, sessions: memoire.sessions, zones: memoire.zones, courriels: memoire.courriels, horloge,
    chiffrement: creerChiffrementDonnees(randomBytes(32)),
    externes: {
      services: memoire.externes,
      apple: creerVerificateurApple({ chercher: apple.chercher, horloge }),
      google: creerVerificateurGoogle({ audiences: ["client-ios.apps.googleusercontent.com"], chercher: google.chercher, horloge }),
    },
  },
}).listen(0, "127.0.0.1");
await new Promise<void>((pret) => serveur.once("listening", () => pret()));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));
const adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;

// Tout ce qui passe par les journaux pendant les tests : jamais de jeton, d'e-mail ni de « sub »
const journaux: string[] = [];
for (const niveau of ["log", "info", "warn", "error"] as const) {
  const original = console[niveau];
  console[niveau] = (...morceaux: unknown[]) => {
    journaux.push(morceaux.map(String).join(" "));
    original(...morceaux);
  };
}

let visiteur = 0;
async function demander(methode: string, chemin: string, options: { corps?: unknown; jeton?: string } = {}) {
  const reponse = await fetch(`${adresse}${chemin}`, {
    method: methode,
    headers: {
      "X-IP-Visiteur": `visiteur-${++visiteur}`, "Content-Type": "application/json",
      ...(options.jeton ? { Authorization: `Bearer ${options.jeton}` } : {}),
    },
    body: options.corps === undefined ? undefined : JSON.stringify(options.corps),
  });
  return { statut: reponse.status, corps: (await reponse.json()) as Record<string, any>, entetes: reponse.headers };
}

const NONCE = "nonce-brut-de-l-app-0001";
const MOT_DE_PASSE = "mon chat adore les croissants";
const PROFIL = { prenom: "Zoé", dateNaissance: "1995-03-14", ville: "Nantes", cgu: true };
const jetonApple = (sub: string, email: string | null = null) => ({ identityToken: apple.jeton(sub, email, NONCE), nonce: NONCE });
const jetonGoogle = (sub: string, email = `${sub}@gmail.com`) => ({ idToken: google.jeton(sub, email, null) });
const trouver = (email: string) => [...memoire.comptes.values()].find((compte) => compte.email === email);
const avecMotDePasse = (jetons: Record<string, unknown>) => ({ ...jetons, motDePasse: MOT_DE_PASSE });

/** Un compte du site avec un vrai mot de passe : sa session */
async function creerCompteSite(email: string) {
  const cree = await demander("POST", "/comptes", { corps: { email, motDePasse: MOT_DE_PASSE, prenom: "Léa", ville: "Lyon", dateNaissance: "1990-01-01", cgu: true } });
  assert.equal(cree.statut, 201);
  return cree.corps.session as string;
}
const connexions = async (jeton: string) => (await demander("GET", "/comptes/moi/connexions", { jeton })).corps.connexions;

test("relier : Google (autre e-mail, celui du compte gardé) puis Apple sur un compte avec mot de passe", async () => {
  const jeton = await creerCompteSite("relier@exemple.fr");
  const relie = await demander("POST", "/comptes/moi/connexions/google", { jeton, corps: avecMotDePasse(jetonGoogle("g-relier", "autre.adresse@gmail.com")) });
  assert.deepEqual(relie.corps, { ok: true, connexions: { motDePasse: true, apple: false, google: true } });
  const garde = trouver("relier@exemple.fr");
  assert.equal(garde?.googleSub, "g-relier");
  assert.equal(garde?.emailVerifieLe, null, "une autre adresse ne confirme pas celle du compte");
  // La même identité une deuxième fois : rien ne change
  assert.equal((await demander("POST", "/comptes/moi/connexions/google", { jeton, corps: jetonGoogle("g-relier", "autre.adresse@gmail.com") })).statut, 200);
  const pomme = await demander("POST", "/comptes/moi/connexions/apple", { jeton, corps: avecMotDePasse(jetonApple("a-relier", "Relier@Exemple.fr")) });
  assert.deepEqual(pomme.corps.connexions, { motDePasse: true, apple: true, google: true });
  assert.ok(trouver("relier@exemple.fr")?.emailVerifieLe, "même e-mail, vérifié par Apple : confirmé");
  // Les deux identités connectent bien CE compte, et l'e-mail n'a pas bougé
  const parGoogle = await demander("POST", "/comptes/google", { corps: jetonGoogle("g-relier", "autre.adresse@gmail.com") });
  assert.deepEqual([parGoogle.statut, parGoogle.corps.compte.email], [200, "relier@exemple.fr"]);
});

test("relier : identité d'un AUTRE compte → 409 identite-deja-reliee (jamais de fusion) ; autre identité déjà là → 409 deja-relie", async () => {
  const proprietaire = await demander("POST", "/comptes/google", { corps: { ...jetonGoogle("g-pris", "pris@gmail.com"), ...PROFIL } });
  assert.equal(proprietaire.statut, 201);
  const jeton = await creerCompteSite("second@exemple.fr");
  const pris = await demander("POST", "/comptes/moi/connexions/google", { jeton, corps: jetonGoogle("g-pris", "pris@gmail.com") });
  assert.deepEqual([pris.statut, pris.corps.erreur], [409, "identite-deja-reliee"]);
  assert.equal(trouver("second@exemple.fr")?.googleSub ?? null, null);
  assert.equal(trouver("pris@gmail.com")?.googleSub, "g-pris", "l'autre compte garde son identité");
  assert.equal((await demander("POST", "/comptes/moi/connexions/google", { jeton, corps: avecMotDePasse(jetonGoogle("g-second")) })).statut, 200);
  const deuxieme = await demander("POST", "/comptes/moi/connexions/google", { jeton, corps: jetonGoogle("g-encore-un") });
  assert.deepEqual([deuxieme.statut, deuxieme.corps.erreur], [409, "deja-relie"]);
  // Jeton refusé, champ manquant, sans session
  const faux = await demander("POST", "/comptes/moi/connexions/apple", { jeton, corps: { identityToken: apple.jeton("a", null, NONCE), nonce: "un-autre-nonce" } });
  assert.deepEqual([faux.statut, faux.corps.erreur], [401, "jeton-externe-invalide"]);
  assert.equal((await demander("POST", "/comptes/moi/connexions/apple", { jeton, corps: { nonce: NONCE } })).corps.champ, "identityToken");
  assert.equal((await demander("POST", "/comptes/moi/connexions/google", { corps: jetonGoogle("g-x") })).statut, 401);
});

test("délier avec mot de passe : bon mot de passe → délié ; mauvais → 403 ; rien de relié → 200", async () => {
  const jeton = await creerCompteSite("delier@exemple.fr");
  await demander("POST", "/comptes/moi/connexions/google", { jeton, corps: avecMotDePasse(jetonGoogle("g-delier")) });
  const mauvais = await demander("DELETE", "/comptes/moi/connexions/google", { jeton, corps: { motDePasse: "pas le bon du tout" } });
  assert.deepEqual([mauvais.statut, mauvais.corps.erreur], [403, "mot-de-passe-incorrect"]);
  const sansRien = await demander("DELETE", "/comptes/moi/connexions/google", { jeton, corps: {} });
  assert.equal(sansRien.statut, 403);
  // Un jeton de Google ne remplace pas le mot de passe quand le compte en a un
  assert.equal((await demander("DELETE", "/comptes/moi/connexions/google", { jeton, corps: jetonGoogle("g-delier") })).statut, 403);
  assert.equal(trouver("delier@exemple.fr")?.googleSub, "g-delier");
  const bon = await demander("DELETE", "/comptes/moi/connexions/google", { jeton, corps: { motDePasse: MOT_DE_PASSE } });
  assert.deepEqual(bon.corps, { ok: true, connexions: { motDePasse: true, apple: false, google: false } });
  assert.equal(trouver("delier@exemple.fr")?.googleSub, null);
  // Google ne connecte plus ce compte : il en créerait un autre (ici : profil à compléter)
  assert.equal((await demander("POST", "/comptes/google", { corps: jetonGoogle("g-delier", "ailleurs@gmail.com") })).corps.erreur, "profil-a-completer");
  assert.equal((await demander("DELETE", "/comptes/moi/connexions/apple", { jeton, corps: {} })).statut, 200, "rien à délier");
  assert.equal((await demander("DELETE", "/comptes/moi/connexions/twitter", { jeton, corps: {} })).corps.champ, "fournisseur");
});

test("dernière connexion : un compte Apple seul ne délie jamais Apple ; avec Google relié, confirmé par un jeton de Google", async () => {
  const cree = await demander("POST", "/comptes/apple", { corps: { ...jetonApple("a-seul", "seul@privaterelay.appleid.com"), ...PROFIL } });
  assert.equal(cree.statut, 201);
  const jeton = cree.corps.session as string;
  const seule = await demander("DELETE", "/comptes/moi/connexions/apple", { jeton, corps: jetonApple("a-seul") });
  assert.deepEqual([seule.statut, seule.corps.erreur], [409, "derniere-connexion"]);
  await demander("POST", "/comptes/moi/connexions/google", { jeton, corps: { ...jetonGoogle("g-seul"), confirmation: jetonApple("a-seul") } });
  assert.deepEqual(await connexions(jeton), { motDePasse: false, apple: true, google: true });
  // Confirmation : un jeton frais de l'AUTRE fournisseur (Google), du compte relié
  const sansJeton = await demander("DELETE", "/comptes/moi/connexions/apple", { jeton, corps: {} });
  assert.deepEqual([sansJeton.statut, sansJeton.corps.champ], [400, "confirmation"]);
  const memeFournisseur = await demander("DELETE", "/comptes/moi/connexions/apple", { jeton, corps: jetonApple("a-seul") });
  assert.deepEqual([memeFournisseur.statut, memeFournisseur.corps.champ], [400, "confirmation"]);
  const autreGoogle = await demander("DELETE", "/comptes/moi/connexions/apple", { jeton, corps: jetonGoogle("g-inconnu") });
  assert.deepEqual([autreGoogle.statut, autreGoogle.corps.erreur], [403, "confirmation-incorrecte"]);
  const motDePasse = await demander("DELETE", "/comptes/moi/connexions/apple", { jeton, corps: { motDePasse: "nimporte quoi du tout" } });
  assert.equal(motDePasse.statut, 400, "pas de mot de passe sur ce compte");
  assert.equal(trouver("seul@privaterelay.appleid.com")?.appleSub, "a-seul");
  const bon = await demander("DELETE", "/comptes/moi/connexions/apple", { jeton, corps: jetonGoogle("g-seul") });
  assert.deepEqual(bon.corps, { ok: true, connexions: { motDePasse: false, apple: false, google: true } });
  // Google est maintenant la seule façon de se connecter
  const derniere = await demander("DELETE", "/comptes/moi/connexions/google", { jeton, corps: jetonApple("a-seul") });
  assert.deepEqual([derniere.statut, derniere.corps.erreur], [409, "derniere-connexion"]);
});

test("délier : la règle « dernière connexion » tient aussi dans les données (deux délier en même temps)", async () => {
  const cree = await demander("POST", "/comptes/google", { corps: { ...jetonGoogle("g-course", "course@gmail.com"), ...PROFIL } });
  const compte = trouver("course@gmail.com");
  assert.ok(compte);
  await demander("POST", "/comptes/moi/connexions/apple", { jeton: cree.corps.session, corps: { ...jetonApple("a-course"), confirmation: jetonGoogle("g-course", "course@gmail.com") } });
  const [un, deux] = await Promise.all([memoire.externes.delierSub(compte.id, "apple"), memoire.externes.delierSub(compte.id, "google")]);
  assert.deepEqual([un, deux], ["ok", "derniere-connexion"]);
  assert.equal(await memoire.externes.delierSub(compte.id, "apple"), "non-relie");
  assert.equal(await memoire.externes.delierSub(999_999, "apple"), "introuvable");
});

test("limite : 10 demandes par compte et par heure pour relier et délier ensemble, puis 429", async () => {
  const jeton = await creerCompteSite("limite@exemple.fr");
  const statuts: number[] = [];
  for (let i = 0; i < 10; i++) statuts.push((await demander("DELETE", "/comptes/moi/connexions/apple", { jeton, corps: {} })).statut);
  const trop = await demander("POST", "/comptes/moi/connexions/google", { jeton, corps: jetonGoogle("g-limite") });
  assert.deepEqual([statuts.every((statut) => statut === 200), trop.statut, trop.corps.erreur], [true, 429, "trop-de-demandes"]);
  assert.ok(Number(trop.entetes.get("retry-after")) > 0);
  // Un autre compte n'est pas gêné
  const autre = await creerCompteSite("limite-autre@exemple.fr");
  assert.equal((await demander("POST", "/comptes/moi/connexions/google", { jeton: autre, corps: avecMotDePasse(jetonGoogle("g-limite")) })).statut, 200);
});

test("relier avec mot de passe : une session seule ne suffit plus (session volée), et la même attente que « Mon compte »", async () => {
  const email = "session-volee@exemple.fr";
  const jeton = await creerCompteSite(email);
  const seule = await demander("POST", "/comptes/moi/connexions/apple", { jeton, corps: jetonApple("a-voleur", "voleur@icloud.com") });
  assert.deepEqual([seule.statut, seule.corps.erreur, seule.corps.champ], [400, "champ-invalide", "confirmation"]);
  const vide = await demander("POST", "/comptes/moi/connexions/apple", { jeton, corps: { ...jetonApple("a-voleur"), motDePasse: "" } });
  assert.deepEqual([vide.statut, vide.corps.champ], [400, "confirmation"]);
  const parJeton = await demander("POST", "/comptes/moi/connexions/apple", { jeton, corps: { ...jetonApple("a-voleur"), confirmation: jetonGoogle("g-voleur") } });
  assert.deepEqual([parJeton.statut, parJeton.corps.champ], [400, "confirmation"], "un jeton ne remplace pas le mot de passe");
  const statuts: number[] = [];
  for (let i = 0; i < 5; i++) {
    statuts.push((await demander("POST", "/comptes/moi/connexions/apple", { jeton, corps: { ...jetonApple("a-voleur"), motDePasse: "pas le bon du tout" } })).statut);
  }
  assert.deepEqual(statuts, [403, 403, 403, 403, 403]);
  const patiente = await demander("POST", "/comptes/moi/connexions/apple", { jeton, corps: avecMotDePasse(jetonApple("a-voleur")) });
  assert.deepEqual([patiente.statut, patiente.corps.erreur, patiente.corps.attente > 0], [429, "trop-de-demandes", true]);
  const change = await demander("POST", "/comptes/moi/mot-de-passe", { jeton, corps: { actuel: MOT_DE_PASSE, nouveau: "une toute nouvelle phrase" } });
  assert.equal(change.statut, 429, "même attente que changer de mot de passe");
  assert.equal(trouver(email)?.appleSub ?? null, null, "rien n'est relié");
  assert.equal((await demander("POST", "/comptes/apple", { corps: jetonApple("a-voleur", "voleur@icloud.com") })).corps.erreur, "profil-a-completer", "son Apple n'ouvre pas ce compte");
});

test("relier sans mot de passe : un NOUVEAU jeton de l'autre fournisseur, à part dans « confirmation » avec son propre nonce", async () => {
  const cree = await demander("POST", "/comptes/google", { corps: { ...jetonGoogle("g-sans", "sans@gmail.com"), ...PROFIL } });
  assert.equal(cree.statut, 201);
  const jeton = cree.corps.session as string;
  const relierApple = (corps: Record<string, unknown>) => demander("POST", "/comptes/moi/connexions/apple", { jeton, corps: { ...jetonApple("a-sans"), ...corps } });
  for (const corps of [{}, { motDePasse: "nimporte quoi du tout" }, { confirmation: jetonApple("a-sans") }, jetonGoogle("g-sans"), { confirmation: "g-sans" }]) {
    const refus = await relierApple(corps);
    assert.deepEqual([refus.statut, refus.corps.champ], [400, "confirmation"], JSON.stringify(Object.keys(corps)));
  }
  const autreGoogle = await relierApple({ confirmation: jetonGoogle("g-inconnu") });
  assert.deepEqual([autreGoogle.statut, autreGoogle.corps.erreur], [403, "confirmation-incorrecte"]);
  assert.equal(trouver("sans@gmail.com")?.appleSub ?? null, null);
  const nonceGoogle = "nonce-a-part-pour-google-02";
  const bon = await relierApple({ confirmation: { idToken: google.jeton("g-sans", "sans@gmail.com", nonceGoogle), nonce: nonceGoogle } });
  assert.deepEqual(bon.corps, { ok: true, connexions: { motDePasse: false, apple: true, google: true } });
  assert.equal(trouver("sans@gmail.com")?.appleSub, "a-sans");
});

test("journaux : jamais de jeton, d'e-mail ni de « sub »", () => {
  const tout = journaux.join("\n");
  for (const interdit of ["@exemple.fr", "@gmail.com", "privaterelay", "g-relier", "a-relier", "g-pris", "a-seul", "a-voleur", "g-sans", "eyJ"]) {
    assert.ok(!tout.includes(interdit), `les journaux ne contiennent pas « ${interdit} »`);
  }
});
