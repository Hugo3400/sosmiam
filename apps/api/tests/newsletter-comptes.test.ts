// Tests de la case « newsletter » à la création d'un compte de l'app (« soft opt-in » de la CNIL) : POST /comptes avec
// l'espace « app », et la création par Apple ou Google. On n'inscrit que sur `newsletter: true`, sans attendre la
// réponse ; une panne ne fait jamais échouer la création ; une connexion n'inscrit jamais.
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

/** La fausse newsletter : garde chaque appel ; `enPanne` la fait rejeter */
const newsletter = { appels: [] as { email: string; ville: string | null }[], enPanne: false };
beforeEach(() => {
  newsletter.appels = [];
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

test("newsletter: false, null ou absente : personne n'est inscrit ; ignorée pour les espaces du site", async () => {
  for (const retouches of [{ newsletter: false }, { newsletter: null }, {}]) {
    assert.equal((await demander("/comptes", inscriptionApp(retouches))).statut, 201);
  }
  // Espace ambassadeur ou pro : la case n'existe pas, le champ est ignoré (même mal formé)
  for (const espace of ["ambassadeur", "pro"]) {
    assert.equal((await demander("/comptes", inscriptionApp({ espace, newsletter: "oui" }))).statut, 201, espace);
  }
  await laisserPasser();
  assert.deepEqual(newsletter.appels, []);
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
  // Création sans la case, ou avec false : rien ; mal formée : 400
  assert.equal((await viaGoogle("google-sans", "sans@gmail.com", PROFIL)).statut, 201);
  assert.equal((await viaGoogle("google-faux", "faux@gmail.com", { ...PROFIL, newsletter: false })).statut, 201);
  const invalide = await viaApple("apple-invalide", "invalide@privaterelay.appleid.com", { ...PROFIL, newsletter: "oui" });
  assert.deepEqual([invalide.statut, invalide.corps.champ], [400, "newsletter"]);
  await laisserPasser();
  assert.deepEqual(newsletter.appels, []);
});
