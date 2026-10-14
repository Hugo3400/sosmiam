// Tests de la case « newsletter » à la création d'un compte (« soft opt-in » de la CNIL) : POST /comptes avec l'espace
// « app » ou « ambassadeur », et la création par Apple ou Google. Cochée : un compte de l'app est inscrit (un ambassadeur,
// plus tard, à la validation) ; décochée : le refus est retenu (noterRefus). Toujours sans attendre la réponse ; une panne
// ne fait jamais échouer la création ; une connexion n'inscrit jamais et ne retient rien.
// Tout en mémoire, clé de chiffrement de TEST, faux Apple et faux Google, fausse newsletter : aucune base, aucun réseau.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import type { AddressInfo } from "node:net";
import { after, beforeEach, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import { creerChiffrementDonnees } from "../src/services/chiffrement-donnees.ts";
import { creerComptesEnMemoire } from "../src/services/comptes-en-memoire.ts";
import { creerVerificateurApple, creerVerificateurGoogle } from "../src/services/connexion-externe.ts";
import { creerFauxFournisseur } from "./outils/creer-faux-fournisseur.ts";

const banc = { horloge: Date.parse("2026-10-09T10:00:00Z") };
const horloge = () => banc.horloge;
const memoire = creerComptesEnMemoire(horloge);
const apple = creerFauxFournisseur("apple", horloge);
const google = creerFauxFournisseur("google", horloge);

/** La fausse newsletter : garde chaque appel (inscriptions et refus) ; `enPanne` la fait rejeter */
const newsletter = { appels: [] as { email: string; ville: string | null }[], refus: [] as string[], enPanne: false };
beforeEach(() => {
  newsletter.appels = [];
  newsletter.refus = [];
  newsletter.enPanne = false;
});

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
    newsletter: {
      async inscrireCompte(email, ville) {
        newsletter.appels.push({ email, ville });
        if (newsletter.enPanne) throw new Error("boîte injoignable");
        return true;
      },
      async noterRefus(email) {
        newsletter.refus.push(email);
        if (newsletter.enPanne) throw new Error("disque plein");
      },
    },
  },
}).listen(0, "127.0.0.1");
await new Promise<void>((pret) => serveur.once("listening", () => pret()));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));
const adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;

let visiteur = 0;
async function demander(chemin: string, corps: unknown) {
  const reponse = await fetch(`${adresse}${chemin}`, {
    method: "POST",
    headers: { "X-IP-Visiteur": `visiteur-${++visiteur}`, "Content-Type": "application/json" },
    body: JSON.stringify(corps),
  });
  return { statut: reponse.status, corps: (await reponse.json()) as Record<string, any> };
}
/** L'inscription n'attend pas la newsletter : on laisse passer un tour avant de compter les appels */
const laisserPasser = () => new Promise((fini) => setTimeout(fini, 20));

let numero = 0;
const inscriptionApp = (retouches: Record<string, unknown> = {}) => ({
  email: `Miami${++numero}@Exemple.fr`, motDePasse: "mon chat adore les croissants", prenom: "Zoé", dateNaissance: "2000-01-31",
  ville: "Nantes", cgu: true, espace: "app", ...retouches,
});
const NONCE = "nonce-brut-de-l-app-0001";
const PROFIL = { prenom: "Zoé", dateNaissance: "2000-03-14", ville: "Lyon", cgu: true };
const viaApple = (sub: string, email: string, corps: Record<string, unknown> = {}) =>
  demander("/comptes/apple", { identityToken: apple.jeton(sub, email, NONCE), nonce: NONCE, ...corps });
const viaGoogle = (sub: string, email: string, corps: Record<string, unknown> = {}) =>
  demander("/comptes/google", { idToken: google.jeton(sub, email, null), ...corps });

test("inscription « app » avec newsletter: true : inscrite une fois, e-mail en minuscules et ville du profil", async () => {
  const corps = inscriptionApp({ newsletter: true, ville: " Lille " });
  const { statut } = await demander("/comptes", corps);
  assert.equal(statut, 201);
  await laisserPasser();
  assert.deepEqual(newsletter.appels, [{ email: corps.email.toLowerCase(), ville: "Lille" }]);
});

test("inscription « app » : false retient le refus une fois (en minuscules) ; null ou absente : rien ; l'espace pro ignore la case", async () => {
  const refuse = inscriptionApp({ newsletter: false });
  assert.equal((await demander("/comptes", refuse)).statut, 201);
  for (const retouches of [{ newsletter: null }, {}]) {
    assert.equal((await demander("/comptes", inscriptionApp(retouches))).statut, 201);
  }
  // Espace pro : la case n'existe pas, le champ est ignoré (même mal formé, ou false)
  for (const valeur of ["oui", false, true]) {
    assert.equal((await demander("/comptes", inscriptionApp({ espace: "pro", newsletter: valeur }))).statut, 201, String(valeur));
  }
  await laisserPasser();
  assert.deepEqual(newsletter.appels, []);
  assert.deepEqual(newsletter.refus, [refuse.email.toLowerCase()]);
});

test("espace ambassadeur : la case est lue ; cochée, rien ici (inscription à la validation) ; décochée, refus retenu une fois", async () => {
  const coche = await demander("/comptes", inscriptionApp({ espace: "ambassadeur", newsletter: true }));
  assert.equal(coche.statut, 201);
  assert.equal(coche.corps.compte.ambassadeur?.statut, "en-attente");
  const decoche = inscriptionApp({ espace: "ambassadeur", newsletter: false });
  assert.equal((await demander("/comptes", decoche)).statut, 201);
  // Sans le champ (ancien formulaire) : rien
  assert.equal((await demander("/comptes", inscriptionApp({ espace: "ambassadeur" }))).statut, 201);
  await laisserPasser();
  assert.deepEqual(newsletter.appels, []);
  assert.deepEqual(newsletter.refus, [decoche.email.toLowerCase()]);
});

test("espace ambassadeur : newsletter qui n'est pas un booléen → 400 champ-invalide, rien n'est créé ni retenu", async () => {
  const avant = memoire.comptes.size;
  for (const valeur of ["oui", "false", 0, []]) {
    const { statut, corps } = await demander("/comptes", inscriptionApp({ espace: "ambassadeur", newsletter: valeur }));
    assert.deepEqual([statut, corps.erreur, corps.champ], [400, "champ-invalide", "newsletter"]);
  }
  assert.equal(memoire.comptes.size, avant);
  await laisserPasser();
  assert.deepEqual([newsletter.appels, newsletter.refus], [[], []]);
});

test("un e-mail déjà pris (409) ou un âge refusé (403) : aucun refus retenu pour cette adresse", async () => {
  const premier = inscriptionApp({ espace: "ambassadeur" });
  assert.equal((await demander("/comptes", premier)).statut, 201);
  const doublon = await demander("/comptes", { ...premier, newsletter: false });
  assert.deepEqual([doublon.statut, doublon.corps.erreur], [409, "email-deja-utilise"]);
  const jeune = await demander("/comptes", inscriptionApp({ espace: "ambassadeur", newsletter: false, dateNaissance: "2015-01-01" }));
  assert.equal(jeune.statut, 403);
  await laisserPasser();
  assert.deepEqual(newsletter.refus, []);
});

test("refus en panne : l'inscription réussit quand même (session ouverte), journal sans l'e-mail", async () => {
  newsletter.enPanne = true;
  const erreurs: unknown[][] = [];
  const journal = console.error;
  console.error = (...morceaux: unknown[]) => void erreurs.push(morceaux);
  try {
    const ambassadeur = inscriptionApp({ espace: "ambassadeur", newsletter: false });
    const app = inscriptionApp({ newsletter: false });
    for (const corps of [ambassadeur, app]) {
      const { statut, corps: reponse } = await demander("/comptes", corps);
      assert.equal(statut, 201);
      assert.ok(reponse.session);
    }
    await laisserPasser();
    assert.equal(newsletter.refus.length, 2);
    const texte = JSON.stringify(erreurs.map((morceaux) => morceaux.map(String)));
    assert.match(texte, /refus de la newsletter/);
    for (const corps of [ambassadeur, app]) assert.ok(!texte.toLowerCase().includes(corps.email.toLowerCase()), "jamais d'e-mail dans le journal");
  } finally {
    console.error = journal;
  }
});

test("newsletter qui n'est pas un booléen : 400 champ-invalide, rien n'est créé", async () => {
  const avant = memoire.comptes.size;
  for (const valeur of ["true", 1, "oui", {}]) {
    const { statut, corps } = await demander("/comptes", inscriptionApp({ newsletter: valeur }));
    assert.deepEqual([statut, corps.erreur, corps.champ], [400, "champ-invalide", "newsletter"]);
  }
  assert.equal(memoire.comptes.size, avant);
  await laisserPasser();
  assert.deepEqual(newsletter.appels, []);
});

test("newsletter en panne : l'inscription réussit quand même (session ouverte)", async () => {
  newsletter.enPanne = true;
  const erreurs: unknown[][] = [];
  const journal = console.error;
  console.error = (...morceaux: unknown[]) => void erreurs.push(morceaux);
  try {
    const corps = inscriptionApp({ newsletter: true });
    const { statut, corps: reponse } = await demander("/comptes", corps);
    assert.equal(statut, 201);
    assert.ok(reponse.session);
    await laisserPasser();
    assert.equal(newsletter.appels.length, 1);
    // La panne est journalisée, sans l'e-mail
    const texte = JSON.stringify(erreurs.map((morceaux) => morceaux.map(String)));
    assert.match(texte, /newsletter/);
    assert.ok(!texte.toLowerCase().includes(corps.email.toLowerCase()), "jamais d'e-mail dans le journal");
  } finally {
    console.error = journal;
  }
});

test("Apple et Google : la création avec newsletter: true inscrit ; une connexion (compte existant) jamais", async () => {
  const creeApple = await viaApple("apple-newsletter", "Zoe.Apple@privaterelay.appleid.com", { ...PROFIL, newsletter: true });
  assert.equal(creeApple.statut, 201);
  const creeGoogle = await viaGoogle("google-newsletter", "zoe.google@gmail.com", { ...PROFIL, ville: "Brest", newsletter: true });
  assert.equal(creeGoogle.statut, 201);
  await laisserPasser();
  assert.deepEqual(newsletter.appels, [
    { email: "zoe.apple@privaterelay.appleid.com", ville: "Lyon" },
    { email: "zoe.google@gmail.com", ville: "Brest" },
  ]);
  newsletter.appels = [];
  // Connexion d'un compte déjà lié (b), puis rattachement d'un compte qui a le même e-mail (c) : jamais d'inscription
  const connexion = await viaApple("apple-newsletter", "zoe.apple@privaterelay.appleid.com", { newsletter: true });
  assert.deepEqual([connexion.statut, connexion.corps.nouveau], [200, false]);
  const site = inscriptionApp({ espace: "pro" });
  assert.equal((await demander("/comptes", site)).statut, 201);
  const rattache = await viaGoogle("google-rattache", site.email.toLowerCase(), { newsletter: true });
  assert.deepEqual([rattache.statut, rattache.corps.rattache], [200, true]);
  // Création sans la case, ou avec false : pas d'inscription ; mal formée : 400
  assert.equal((await viaGoogle("google-sans", "sans@gmail.com", PROFIL)).statut, 201);
  assert.equal((await viaGoogle("google-faux", "faux@gmail.com", { ...PROFIL, newsletter: false })).statut, 201);
  const invalide = await viaApple("apple-invalide", "invalide@privaterelay.appleid.com", { ...PROFIL, newsletter: "oui" });
  assert.deepEqual([invalide.statut, invalide.corps.champ], [400, "newsletter"]);
  await laisserPasser();
  assert.deepEqual(newsletter.appels, []);
  // Seul le « non » à la création est retenu (ni connexion, ni rattachement)
  assert.deepEqual(newsletter.refus, ["faux@gmail.com"]);
});

test("Apple et Google : décochée à la création, refus retenu une fois ; une connexion avec false ne retient rien", async () => {
  const cree = await viaApple("apple-non", "Non.Merci@privaterelay.appleid.com", { ...PROFIL, newsletter: false });
  assert.equal(cree.statut, 201);
  // « Fais connaissance » : la première demande sans le profil ne crée rien, donc ne retient rien
  const incomplet = await viaGoogle("google-non", "non@gmail.com", { newsletter: false });
  assert.deepEqual([incomplet.statut, incomplet.corps.erreur], [409, "profil-a-completer"]);
  const connexion = await viaApple("apple-non", "non.merci@privaterelay.appleid.com", { newsletter: false });
  assert.deepEqual([connexion.statut, connexion.corps.nouveau], [200, false]);
  await laisserPasser();
  assert.deepEqual(newsletter.refus, ["non.merci@privaterelay.appleid.com"]);
  assert.deepEqual(newsletter.appels, []);
});
