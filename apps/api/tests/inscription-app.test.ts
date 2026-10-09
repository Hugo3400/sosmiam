// Tests de l'inscription de l'app (POST /comptes avec espace « app ») : dès 15 ans, sans fiche d'ambassadeur, nom et date
// de naissance gardés CHIFFRÉS, envies sans « regimes », pseudo unique et sans gros mot, lien de confirmation de l'e-mail ;
// sans clé de chiffrement : 503. Et `compte.age`, les rôles masqués sous 18 ans, `pro.lieuxValides` et l'emoji du lieu.
// Tout en mémoire, avec une clé de TEST : aucune base de données, jamais la vraie clé.
import assert from "node:assert/strict";
import { after, test } from "node:test";

import { creerBancApp } from "./outils/creer-banc-app.ts";

const { banc, memoire, chiffrement, demander, inscriptionApp, inscrireApp, rendrePro, fermer } = await creerBancApp();
const sansCle = await creerBancApp({ sansCle: true });
after(async () => {
  await fermer();
  await sansCle.fermer();
});

/** Le 9 octobre 2026 : née le 9 octobre 2011, on a 15 ans tout juste ; le 10, pas encore */
test("dès 15 ans (jour de Paris) : 201, session « app », compte sans fiche d'ambassadeur, âge rendu", async () => {
  const { statut, corps } = await demander("POST", "/comptes", { corps: inscriptionApp({ dateNaissance: "2011-10-09" }) });
  assert.equal(statut, 201);
  assert.match(corps.session, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(corps.compte.age, 15);
  assert.equal(corps.compte.ambassadeur, null);
  assert.deepEqual(corps.compte.pro, { lieux: [], lieuxValides: [] });
  assert.equal(corps.compte.emailVerifie, false);
  assert.ok(!("dateNaissanceChiffree" in corps.compte), "la date chiffrée ne sort jamais");
  const garde = [...memoire.comptes.values()].find((compte) => compte.email === corps.compte.email);
  assert.equal(garde?.statutAmbassadeur, null);
  // À 23 h 30 à Paris le 9 octobre (21 h 30 UTC) : toujours le 9 ; à 0 h 30 le 10 (22 h 30 UTC le 9) : déjà le 10
  const debut = banc.horloge;
  try {
    banc.horloge = Date.parse("2026-10-08T22:30:00Z");
    assert.equal((await demander("POST", "/comptes", { corps: inscriptionApp({ dateNaissance: "2011-10-09" }) })).statut, 201);
    banc.horloge = Date.parse("2026-10-08T21:30:00Z");
    assert.equal((await demander("POST", "/comptes", { corps: inscriptionApp({ dateNaissance: "2011-10-09" }) })).statut, 403);
  } finally {
    banc.horloge = debut;
  }
});

test("sous 15 ans : 403 age-minimum, et rien n'est gardé (même avec d'autres champs faux)", async () => {
  const avant = memoire.comptes.size;
  for (const dateNaissance of ["2011-10-10", "2020-01-01"]) {
    const { statut, corps } = await demander("POST", "/comptes", { corps: inscriptionApp({ dateNaissance, email: "pas-une-adresse", ville: "" }) });
    assert.equal(statut, 403);
    assert.deepEqual(corps, { ok: false, erreur: "age-minimum" });
  }
  assert.equal(memoire.comptes.size, avant);
  // Le site, lui, reste à 18 ans
  const site = await demander("POST", "/comptes", { corps: inscriptionApp({ espace: "ambassadeur", dateNaissance: "2010-01-01" }) });
  assert.equal(site.statut, 403);
});

test("nom et date de naissance gardés CHIFFRÉS (jamais en clair), ville et envies gardées, pas de fiche d'ambassadeur", async () => {
  const { id } = await inscrireApp({ nom: "  Martin ", dateNaissance: "2003-05-17", ville: " Lyon ", envies: { lieux: ["restos", "restos", "cafes"], cuisines: [] } });
  const garde = memoire.comptes.get(id);
  assert.ok(garde && chiffrement);
  const texte = JSON.stringify(garde);
  assert.ok(!texte.includes("Martin") && !texte.includes("2003-05-17"), "ni le nom ni la date en clair");
  assert.equal(chiffrement.dechiffrer(garde.nomChiffre ?? "", "nom"), "Martin");
  assert.equal(chiffrement.dechiffrer(garde.dateNaissanceChiffree ?? "", "dateNaissance"), "2003-05-17");
  assert.match(garde.dateNaissanceChiffree ?? "", /^v1:/);
  assert.equal(garde.villeApp, "Lyon");
  assert.deepEqual(garde.envies, { lieux: ["restos", "cafes"], cuisines: [] });
  assert.equal(garde.ville, "", "pas de ville d'ambassadeur");
  assert.equal(garde.pseudo, null);
});

test("champs refusés : regimes, catégorie inconnue, prénom, ville, pseudo (forme ou gros mot), support, nom trop long", async () => {
  const avant = memoire.comptes.size;
  const cas: [string, Record<string, unknown>][] = [
    ["envies", { envies: { regimes: ["vegan"] } }],
    ["envies", { envies: { lieux: ["restos"], regimes: [] } }],
    ["envies", { envies: { sports: ["foot"] } }],
    ["envies", { envies: { lieux: "restos" } }],
    ["envies", { envies: { lieux: ["Restos !"] } }],
    ["envies", { envies: ["restos"] }],
    ["prenom", { prenom: "" }],
    ["ville", { ville: "" }],
    ["ville", { ville: undefined }],
    ["pseudo", { pseudo: "a" }],
    ["pseudo", { pseudo: "Zoé Martin" }],
    ["pseudo", { pseudo: "connard69" }],
    ["support", { support: "montre" }],
    ["nom", { nom: "x".repeat(61) }],
    ["dateNaissance", { dateNaissance: "2003-02-30" }],
  ];
  for (const [champ, retouche] of cas) {
    const { statut, corps } = await demander("POST", "/comptes", { corps: inscriptionApp(retouche) });
    assert.equal(statut, 400, champ);
    assert.equal(corps.champ, champ, JSON.stringify(retouche));
  }
  assert.equal(memoire.comptes.size, avant);
});

test("pseudo : gardé en minuscules sans « @ » ; déjà pris : 409 pseudo-pris", async () => {
  const { id } = await inscrireApp({ pseudo: "@Zoe.Martin" });
  assert.equal(memoire.comptes.get(id)?.pseudo, "zoe.martin");
  const { statut, corps } = await demander("POST", "/comptes", { corps: inscriptionApp({ pseudo: "zoe.martin" }) });
  assert.equal(statut, 409);
  assert.deepEqual(corps, { ok: false, erreur: "pseudo-pris" });
});

test("e-mail : lien de confirmation envoyé, vers ambassadeur.sosmiam.fr (comme pour tous) ; e-mail pris : 409", async () => {
  const { id, email } = await inscrireApp();
  const envoi = memoire.envois.find((e) => e.compteId === id);
  assert.equal(envoi?.type, "verification-email");
  assert.match(envoi?.lien ?? "", /^https:\/\/ambassadeur\.sosmiam\.fr\/verifier-email#jeton=/);
  assert.equal((await demander("POST", "/comptes", { corps: inscriptionApp({ email }) })).corps.erreur, "email-deja-utilise");
});

test("sans clé de chiffrement : inscription « app » 503 chiffrement-indisponible, rien de gardé ; le site marche toujours", async () => {
  const avant = sansCle.memoire.comptes.size;
  const { statut, corps } = await sansCle.demander("POST", "/comptes", { corps: sansCle.inscriptionApp() });
  assert.equal(statut, 503);
  assert.deepEqual(corps, { ok: false, erreur: "chiffrement-indisponible" });
  assert.equal(sansCle.memoire.comptes.size, avant);
  const site = await sansCle.demander("POST", "/comptes", { corps: sansCle.inscriptionApp({ espace: "ambassadeur" }) });
  assert.equal(site.statut, 201);
  assert.equal(site.corps.compte.age, null);
  assert.equal(site.corps.compte.ambassadeur.statut, "en-attente");
});

test("rôles : sous 18 ans, ni ambassadeur ni pro rendus (même un lieu validé) ; dès 18 ans, lieuxValides et emoji", async () => {
  const mineur = await inscrireApp({ dateNaissance: "2010-01-01" });
  await rendrePro(mineur.jeton);
  const vuMineur = (await demander("GET", "/comptes/session", { jeton: mineur.jeton })).corps.compte;
  assert.equal(vuMineur.age, 16);
  assert.deepEqual(vuMineur.pro, { lieux: [], lieuxValides: [] });
  assert.equal(vuMineur.ambassadeur, null);
  // Un rôle ambassadeur posé à la main sur un compte mineur ne sort pas non plus
  await memoire.decider(mineur.id, "actif");
  assert.equal((await demander("GET", "/comptes/session", { jeton: mineur.jeton })).corps.compte.ambassadeur, null);

  const majeur = await inscrireApp({ dateNaissance: "2000-01-01" });
  const lieuId = await rendrePro(majeur.jeton);
  const enAttente = memoire.rattachements.length;
  await demander("POST", "/comptes/moi/rattachements", { jeton: majeur.jeton, corps: { lieuId: lieuId + 1000, role: "gerant", preuve: "x" } });
  assert.equal(memoire.rattachements.length, enAttente, "lieu inconnu : rien de plus");
  const vu = (await demander("GET", "/comptes/session", { jeton: majeur.jeton })).corps.compte;
  assert.equal(vu.age, 26);
  const lieu = { lieuId, nom: "Chez Léa", ville: "Montpellier", emoji: "🍝", role: "gerant", statut: "valide" };
  assert.deepEqual(vu.pro, { lieux: [lieu], lieuxValides: [lieu] });
});
