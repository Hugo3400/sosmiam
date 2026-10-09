// Tests de « Se connecter avec Apple » et « avec Google » (POST /comptes/apple, /comptes/google), de GET
// /comptes/moi/connexions et de la suppression d'un compte sans vrai mot de passe. Tout en mémoire, clé de chiffrement de
// TEST, faux Apple et faux Google (clés RSA générées ici) : aucune base, aucun appel réseau.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import type { AddressInfo } from "node:net";
import { after, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import { VERSION_CGU } from "../src/controleurs/comptes.ts";
import { creerChiffrementDonnees } from "../src/services/chiffrement-donnees.ts";
import { creerComptesEnMemoire } from "../src/services/comptes-en-memoire.ts";
import { creerVerificateurApple, creerVerificateurGoogle } from "../src/services/connexion-externe.ts";
import { creerFauxFournisseur } from "./outils/creer-faux-fournisseur.ts";

const banc = { horloge: Date.parse("2026-10-09T10:00:00Z") };
const horloge = () => banc.horloge;
const memoire = creerComptesEnMemoire(horloge);
const chiffrement = creerChiffrementDonnees(randomBytes(32));
const apple = creerFauxFournisseur("apple", horloge);
const google = creerFauxFournisseur("google", horloge);
const verificateurs = {
  apple: creerVerificateurApple({ chercher: apple.chercher, horloge }),
  google: creerVerificateurGoogle({ audiences: ["client-ios.apps.googleusercontent.com"], chercher: google.chercher, horloge }),
};
const serveur = creerApplication({
  enregistrerInscription: async () => {},
  comptes: {
    services: memoire.services, sessions: memoire.sessions, zones: memoire.zones, courriels: memoire.courriels, horloge, chiffrement,
    externes: { services: memoire.externes, ...verificateurs },
  },
}).listen(0, "127.0.0.1");
await new Promise<void>((pret) => serveur.once("listening", () => pret()));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));
const adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;

let visiteur = 0;
async function demander(methode: string, chemin: string, options: { corps?: unknown; jeton?: string; ip?: string } = {}) {
  const reponse = await fetch(`${adresse}${chemin}`, {
    method: methode,
    headers: {
      "X-IP-Visiteur": options.ip ?? `visiteur-${++visiteur}`, "Content-Type": "application/json",
      ...(options.jeton ? { Authorization: `Bearer ${options.jeton}` } : {}),
    },
    body: options.corps === undefined ? undefined : JSON.stringify(options.corps),
  });
  return { statut: reponse.status, corps: (await reponse.json()) as Record<string, any>, entetes: reponse.headers };
}

const NONCE = "nonce-brut-de-l-app-0001";
const PROFIL = { prenom: "Zoé", nom: "Martin", dateNaissance: "2009-03-14", ville: "Nantes", envies: { boissons: ["cafe"] }, cgu: true };
const viaApple = (sub: string, email: string | null, corps: Record<string, unknown> = {}) =>
  demander("POST", "/comptes/apple", { corps: { identityToken: apple.jeton(sub, email, NONCE), nonce: NONCE, ...corps } });
const viaGoogle = (sub: string, email: string, corps: Record<string, unknown> = {}, retouches: Record<string, unknown> = {}) =>
  demander("POST", "/comptes/google", { corps: { idToken: google.jeton(sub, email, null, retouches), ...corps } });
const trouver = (email: string) => [...memoire.comptes.values()].find((compte) => compte.email === email);

test("Apple, première fois : profil à compléter (rien n'est gardé), puis création d'un compte de l'app dès 15 ans", async () => {
  const email = "abc123@privaterelay.appleid.com";
  const incomplet = await viaApple("apple-zoe", email, { prenom: "Zoé" });
  assert.equal(incomplet.statut, 409);
  assert.deepEqual(incomplet.corps, { ok: false, erreur: "profil-a-completer", manque: ["dateNaissance", "ville", "cgu"], prefill: { email, prenom: "Zoé" } });
  // Profil complet mais conditions pas acceptées : encore à compléter ; cgu autre que true : 400
  const { cgu: _cgu, ...sansCgu } = PROFIL;
  assert.deepEqual((await viaApple("apple-zoe", email, sansCgu)).corps.manque, ["cgu"]);
  const cguFaux = await viaApple("apple-zoe", email, { ...PROFIL, cgu: "oui" });
  assert.deepEqual([cguFaux.statut, cguFaux.corps.champ], [400, "cgu"]);
  assert.equal(trouver(email), undefined);
  const cree = await viaApple("apple-zoe", email, PROFIL);
  assert.equal(cree.statut, 201);
  assert.equal(cree.corps.nouveau, true);
  assert.deepEqual([cree.corps.compte.email, cree.corps.compte.emailVerifie, cree.corps.compte.age, cree.corps.compte.ambassadeur], [email, true, 17, null]);
  const garde = trouver(email);
  assert.ok(garde);
  assert.equal(garde.appleSub, "apple-zoe");
  assert.equal(garde.cguVersion, VERSION_CGU);
  assert.match(garde.motDePasse, /^aucun\$/, "aucun vrai mot de passe");
  assert.ok(!JSON.stringify(garde).includes("Martin") && !JSON.stringify(garde).includes("2009-03-14"), "nom et date chiffrés");
  // Session « app » : le profil se lit avec le jeton
  const profil = await demander("GET", "/comptes/moi/profil", { jeton: cree.corps.session });
  assert.deepEqual([profil.corps.profil.nom, profil.corps.profil.dateNaissance, profil.corps.profil.ville], ["Martin", "2009-03-14", "Nantes"]);
  const connexions = await demander("GET", "/comptes/moi/connexions", { jeton: cree.corps.session });
  assert.deepEqual(connexions.corps, { ok: true, connexions: { motDePasse: false, apple: true, google: false } });
  // Sans vrai mot de passe, la connexion par e-mail ne passe jamais
  const parMotDePasse = await demander("POST", "/comptes/session", { corps: { email, motDePasse: garde.motDePasse } });
  assert.deepEqual([parMotDePasse.statut, parMotDePasse.corps.erreur], [401, "identifiants"]);
});

test("Apple, fois suivantes : même sub → connexion (les champs du profil sont ignorés), même sans e-mail dans le jeton", async () => {
  await viaApple("apple-leo", "leo@exemple.fr", { ...PROFIL, prenom: "Léo" });
  const nombre = memoire.comptes.size;
  const connexion = await viaApple("apple-leo", null, { prenom: "Autre", dateNaissance: "2015-01-01", cgu: false });
  assert.equal(connexion.statut, 200);
  assert.deepEqual([connexion.corps.nouveau, connexion.corps.rattache, connexion.corps.compte.prenom], [false, false, "Léo"]);
  assert.equal(memoire.comptes.size, nombre);
  const parSession = await demander("GET", "/comptes/session", { jeton: connexion.corps.session });
  assert.equal(parSession.statut, 200);
});

test("création : sous 15 ans → 403 et rien n'est gardé ; champs invalides → 400 ; pseudo pris → 409 ; sans e-mail → 400", async () => {
  const jeune = await viaApple("apple-jeune", "jeune@exemple.fr", { ...PROFIL, dateNaissance: "2012-01-01" });
  assert.deepEqual([jeune.statut, jeune.corps.erreur], [403, "age-minimum"]);
  // L'âge passe avant tout : même sans prénom ni ville
  assert.equal((await viaApple("apple-jeune", "jeune@exemple.fr", { dateNaissance: "2012-01-01" })).statut, 403);
  assert.equal(trouver("jeune@exemple.fr"), undefined);
  for (const [champ, retouche] of [["dateNaissance", { dateNaissance: "2009-02-30" }], ["ville", { ville: "x" }], ["envies", { envies: { regimes: ["halal"] } }]] as const) {
    const reponse = await viaApple("apple-champs", "champs@exemple.fr", { ...PROFIL, ...retouche });
    assert.deepEqual([reponse.statut, reponse.corps.champ], [400, champ]);
  }
  assert.equal((await viaApple("apple-p1", "p1@exemple.fr", { ...PROFIL, pseudo: "zoe_m" })).statut, 201);
  const pris = await viaApple("apple-p2", "p2@exemple.fr", { ...PROFIL, pseudo: "zoe_m" });
  assert.deepEqual([pris.statut, pris.corps.erreur], [409, "pseudo-pris"]);
  const sansEmail = await viaApple("apple-sans-email", null, PROFIL);
  assert.deepEqual([sansEmail.statut, sansEmail.corps.erreur], [400, "email-manquant"]);
});

test("jetons refusés : 401 jeton-externe-invalide ; champs mal formés : 400", async () => {
  const autreNonce = await demander("POST", "/comptes/apple", { corps: { identityToken: apple.jeton("s", "s@exemple.fr", NONCE), nonce: "un-autre-nonce" } });
  assert.deepEqual([autreNonce.statut, autreNonce.corps.erreur], [401, "jeton-externe-invalide"]);
  const expire = await demander("POST", "/comptes/apple", {
    corps: { identityToken: apple.jeton("s", "s@exemple.fr", NONCE, { exp: banc.horloge / 1000 - 61 }), nonce: NONCE },
  });
  assert.equal(expire.statut, 401);
  const mauvaiseAudience = await viaGoogle("g", "g@gmail.com", {}, { aud: "inconnu.apps.googleusercontent.com" });
  assert.deepEqual([mauvaiseAudience.statut, mauvaiseAudience.corps.erreur], [401, "jeton-externe-invalide"]);
  const nonVerifie = await viaGoogle("g", "g@gmail.com", {}, { email_verified: false });
  assert.equal(nonVerifie.statut, 401);
  const jetonApple = await demander("POST", "/comptes/google", { corps: { idToken: apple.jeton("s", "s@exemple.fr", NONCE) } });
  assert.equal(jetonApple.statut, 401, "un jeton d'Apple ne vaut rien chez Google");
  assert.deepEqual((await demander("POST", "/comptes/apple", { corps: { nonce: NONCE } })).corps, { ok: false, erreur: "champ-invalide", champ: "identityToken" });
  assert.equal((await demander("POST", "/comptes/apple", { corps: { identityToken: "x.y.z" } })).corps.champ, "nonce");
  assert.equal((await demander("POST", "/comptes/google", { corps: { idToken: "x.y.z", nonce: "court" } })).corps.champ, "nonce");
  assert.equal((await demander("POST", "/comptes/google", { corps: {} })).corps.champ, "idToken");
  assert.equal((await demander("POST", "/comptes/apple", { corps: { identityToken: "x.y.z", nonce: NONCE, support: "tv" } })).corps.champ, "support");
});

test("Google : e-mail vérifié d'un compte du site → ce compte reçoit le sub (pas de second compte), sans date : majeur", async () => {
  const site = await demander("POST", "/comptes", {
    corps: { email: "lea@exemple.fr", motDePasse: "mon chat adore les croissants", prenom: "Léa", ville: "Lyon", dateNaissance: "1990-01-01", cgu: true },
  });
  assert.equal(site.statut, 201);
  const nombre = memoire.comptes.size;
  const lie = await viaGoogle("google-lea", "Lea@Exemple.fr");
  assert.equal(lie.statut, 200);
  assert.deepEqual([lie.corps.nouveau, lie.corps.rattache, lie.corps.compte.prenom, lie.corps.compte.age, lie.corps.compte.emailVerifie], [false, true, "Léa", null, true]);
  assert.equal(memoire.comptes.size, nombre);
  const garde = trouver("lea@exemple.fr");
  assert.equal(garde?.googleSub, "google-lea");
  assert.equal(garde?.dateNaissanceChiffree, null, "le compte du site garde sa situation");
  // Ensuite : connexion par le sub ; le mot de passe marche toujours ; un AUTRE compte Google au même e-mail : 409
  assert.equal((await viaGoogle("google-lea", "lea@exemple.fr")).corps.rattache, false);
  assert.equal((await demander("POST", "/comptes/session", { corps: { email: "lea@exemple.fr", motDePasse: "mon chat adore les croissants" } })).statut, 201);
  const autre = await viaGoogle("google-autre", "lea@exemple.fr");
  assert.deepEqual([autre.statut, autre.corps.erreur], [409, "compte-deja-rattache"]);
  // Apple au même e-mail : lié aussi (un compte peut avoir les deux)
  assert.equal((await viaApple("apple-lea", "lea@exemple.fr")).corps.rattache, true);
  const connexions = await demander("GET", "/comptes/moi/connexions", { jeton: lie.corps.session });
  assert.deepEqual(connexions.corps.connexions, { motDePasse: true, apple: true, google: true });
});

test("Google : création avec prénom et nom du jeton pour pré-remplir ; nonce vérifié s'il est envoyé", async () => {
  const incomplet = await viaGoogle("google-sam", "sam@gmail.com");
  assert.deepEqual(incomplet.corps.prefill, { email: "sam@gmail.com", prenom: "Zoé", nom: "Martin" });
  const avecNonce = await demander("POST", "/comptes/google", { corps: { idToken: google.jeton("google-sam", "sam@gmail.com", "nonce-google-0001"), nonce: "nonce-google-0001", ...PROFIL } });
  assert.equal(avecNonce.statut, 201);
  assert.equal(trouver("sam@gmail.com")?.googleSub, "google-sam");
  const mauvais = await demander("POST", "/comptes/google", { corps: { idToken: google.jeton("google-sam", "sam@gmail.com", "nonce-google-0001"), nonce: "nonce-google-0002" } });
  assert.equal(mauvais.statut, 401);
});

test("supprimer un compte sans vrai mot de passe : nouveau jeton du même compte Apple ou Google, jamais la session seule", async () => {
  const cree = await viaApple("apple-efface", "efface@exemple.fr", PROFIL);
  const jeton = cree.corps.session as string;
  const sansRien = await demander("DELETE", "/comptes/moi", { jeton, corps: {} });
  assert.deepEqual([sansRien.statut, sansRien.corps.champ], [400, "confirmation"]);
  const motDePasse = await demander("DELETE", "/comptes/moi", { jeton, corps: { motDePasse: "nimporte quoi du tout" } });
  assert.equal(motDePasse.statut, 400);
  const autreCompte = await demander("DELETE", "/comptes/moi", { jeton, corps: { identityToken: apple.jeton("apple-zoe", "x@exemple.fr", NONCE), nonce: NONCE } });
  assert.deepEqual([autreCompte.statut, autreCompte.corps.erreur], [403, "confirmation-incorrecte"]);
  const google1 = await demander("DELETE", "/comptes/moi", { jeton, corps: { idToken: google.jeton("apple-efface", "efface@exemple.fr", null) } });
  assert.equal(google1.statut, 403, "aucun compte Google lié");
  const faux = await demander("DELETE", "/comptes/moi", { jeton, corps: { identityToken: apple.jeton("apple-efface", null, NONCE), nonce: "autre-nonce-0001" } });
  assert.equal(faux.statut, 403);
  assert.ok(trouver("efface@exemple.fr"));
  const bon = await demander("DELETE", "/comptes/moi", { jeton, corps: { identityToken: apple.jeton("apple-efface", null, NONCE), nonce: NONCE } });
  assert.deepEqual(bon.corps, { ok: true });
  assert.equal(trouver("efface@exemple.fr"), undefined);
  assert.equal((await demander("GET", "/comptes/session", { jeton })).statut, 401);
  // Un compte avec un vrai mot de passe : toujours le mot de passe
  const site = await demander("POST", "/comptes", {
    corps: { email: "mdp@exemple.fr", motDePasse: "mon chat adore les croissants", prenom: "Mo", ville: "Lyon", dateNaissance: "1990-01-01", cgu: true },
  });
  await viaApple("apple-mdp", "mdp@exemple.fr");
  const parJeton = await demander("DELETE", "/comptes/moi", { jeton: site.corps.session, corps: { identityToken: apple.jeton("apple-mdp", null, NONCE), nonce: NONCE } });
  assert.deepEqual([parJeton.statut, parJeton.corps.erreur], [403, "mot-de-passe-incorrect"]);
});

test("pannes et réglages : clés injoignables → 503 verification-indisponible ; non branché → 503 ; 20 essais par visiteur", async () => {
  const sans = creerApplication({
    enregistrerInscription: async () => {},
    comptes: { services: memoire.services, sessions: memoire.sessions, zones: memoire.zones, courriels: memoire.courriels, horloge, chiffrement,
      externes: { services: memoire.externes, apple: creerVerificateurApple({ chercher: async () => Promise.reject(new TypeError("fetch failed")), horloge }), google: null } },
  }).listen(0, "127.0.0.1");
  await new Promise<void>((pret) => sans.once("listening", () => pret()));
  const ailleurs = `http://127.0.0.1:${(sans.address() as AddressInfo).port}`;
  const envoyer = async (chemin: string, corps: unknown) => {
    const reponse = await fetch(`${ailleurs}${chemin}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
    return { statut: reponse.status, corps: (await reponse.json()) as Record<string, any>, entetes: reponse.headers };
  };
  const panne = await envoyer("/comptes/apple", { identityToken: apple.jeton("x", "x@exemple.fr", NONCE), nonce: NONCE });
  assert.deepEqual([panne.statut, panne.corps.erreur, panne.entetes.get("retry-after")], [503, "verification-indisponible", "30"]);
  const pasDeGoogle = await envoyer("/comptes/google", { idToken: google.jeton("x", "x@gmail.com", null) });
  assert.deepEqual([pasDeGoogle.statut, pasDeGoogle.corps.erreur], [503, "google-indisponible"]);
  await new Promise<void>((fini) => sans.close(() => fini()));
  const statuts: number[] = [];
  for (let i = 0; i < 21; i++) statuts.push((await demander("POST", "/comptes/google", { corps: { idToken: "x.y.z" }, ip: "198.51.100.77" })).statut);
  assert.deepEqual([statuts.slice(0, 20).every((statut) => statut === 401), statuts[20]], [true, 429]);
});
