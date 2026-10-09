// Tests du filtre des gros mots dans le PRÉNOM (nomPublicContientMotInterdit de packages/commun, comme le pseudo) :
// inscription du site et de l'app, « Mon compte » (PATCH /comptes/moi), profil de l'app (PATCH /comptes/moi/profil),
// création par Apple et Google. Refus : 400 champ-invalide { champ: "prenom" }, rien n'est gardé. Un prénom déjà enregistré
// n'est jamais refusé quand il revient tel quel. Tout en mémoire, clé et faux fournisseurs de TEST : aucune base.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import type { AddressInfo } from "node:net";
import { after, test } from "node:test";

import { nomPublicContientMotInterdit } from "../../../packages/commun/src/validation/nom-public-contient-mot-interdit.ts";
import { creerApplication } from "../src/application.ts";
import { creerChiffrementDonnees } from "../src/services/chiffrement-donnees.ts";
import { creerComptesEnMemoire } from "../src/services/comptes-en-memoire.ts";
import { creerVerificateurApple, creerVerificateurGoogle } from "../src/services/connexion-externe.ts";
import { creerFauxFournisseur } from "./outils/creer-faux-fournisseur.ts";

const horloge = () => Date.parse("2026-10-09T10:00:00Z");
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

let visiteur = 0;
async function demander(methode: string, chemin: string, corps?: unknown, jeton?: string) {
  const reponse = await fetch(`${adresse}${chemin}`, {
    method: methode,
    headers: { "X-IP-Visiteur": `visiteur-${++visiteur}`, "Content-Type": "application/json", ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}) },
    body: corps === undefined ? undefined : JSON.stringify(corps),
  });
  return { statut: reponse.status, corps: (await reponse.json()) as Record<string, any> };
}

const GROS_MOTS = ["Connard", "pute69", "c0nn4rd", "Hitler"];
const REFUS = { ok: false, erreur: "champ-invalide", champ: "prenom" };
const MOT_DE_PASSE = "mon chat adore les croissants";
let numero = 0;
const inscription = (espace: string, prenom: string) => ({
  email: `prenom${++numero}@exemple.fr`, motDePasse: MOT_DE_PASSE, prenom, dateNaissance: "2000-01-31", ville: "Nantes", cgu: true, espace,
});
const nombreDeComptes = () => memoire.comptes.size;

test("les exemples sont bien des gros mots pour la règle commune, et les prénoms ordinaires passent", () => {
  for (const mot of GROS_MOTS) assert.equal(nomPublicContientMotInterdit(mot), true, mot);
  for (const prenom of ["Constance", "Zoé", "Marie-Ève"]) assert.equal(nomPublicContientMotInterdit(prenom), false, prenom);
});

test("inscription (app, espace pro, espace ambassadeur) : gros mot → 400 champ prenom, rien n'est gardé", async () => {
  for (const espace of ["app", "pro", "ambassadeur"]) {
    for (const mot of GROS_MOTS) {
      const avant = nombreDeComptes();
      const reponse = await demander("POST", "/comptes", inscription(espace, mot));
      assert.deepEqual([reponse.statut, reponse.corps], [400, REFUS], `${espace} ${mot}`);
      assert.equal(nombreDeComptes(), avant);
    }
    assert.equal((await demander("POST", "/comptes", inscription(espace, "Constance"))).statut, 201, espace);
  }
});

test("Mon compte et profil de l'app : gros mot refusé ; le prénom déjà enregistré, renvoyé tel quel, passe toujours", async () => {
  const cree = await demander("POST", "/comptes", inscription("app", "Zoé"));
  const jeton = cree.corps.session as string;
  const id = [...memoire.comptes.values()].find((compte) => compte.prenom === "Zoé" && compte.email === `prenom${numero}@exemple.fr`)?.id;
  for (const chemin of ["/comptes/moi", "/comptes/moi/profil"]) {
    const refus = await demander("PATCH", chemin, { prenom: "Connard" }, jeton);
    assert.deepEqual([refus.statut, refus.corps], [400, REFUS], chemin);
    assert.equal(memoire.comptes.get(id ?? 0)?.prenom, "Zoé");
  }
  assert.equal((await demander("PATCH", "/comptes/moi", { prenom: "Zoé-Lou" }, jeton)).statut, 200);
  // Un prénom enregistré avant qu'un mot entre dans la liste : jamais rendu illisible, il revient tel quel avec le formulaire
  const garde = memoire.comptes.get(id ?? 0);
  assert.ok(garde);
  garde.prenom = "Hitler";
  assert.equal((await demander("PATCH", "/comptes/moi", { prenom: "Hitler", ville: "Lyon" }, jeton)).statut, 200);
  assert.equal((await demander("PATCH", "/comptes/moi/profil", { prenom: "Hitler", prive: true }, jeton)).statut, 200);
  assert.equal((await demander("GET", "/comptes/session", undefined, jeton)).corps.compte.prenom, "Hitler");
});

test("Apple et Google, création du compte : gros mot → 400 champ prenom, rien n'est gardé", async () => {
  const nonce = "nonce-brut-de-l-app-0042";
  const profil = { nom: "Martin", dateNaissance: "2000-03-14", ville: "Nantes", cgu: true };
  const avant = nombreDeComptes();
  const viaApple = await demander("POST", "/comptes/apple", { identityToken: apple.jeton("apple-gros-mot", "a1@privaterelay.appleid.com", nonce), nonce, ...profil, prenom: "pute69" });
  assert.deepEqual([viaApple.statut, viaApple.corps], [400, REFUS]);
  const viaGoogle = await demander("POST", "/comptes/google", { idToken: google.jeton("google-gros-mot", "g1@exemple.fr", null, {}), ...profil, prenom: "c0nn4rd" });
  assert.deepEqual([viaGoogle.statut, viaGoogle.corps], [400, REFUS]);
  assert.equal(nombreDeComptes(), avant);
  const correct = await demander("POST", "/comptes/google", { idToken: google.jeton("google-gros-mot", "g1@exemple.fr", null, {}), ...profil, prenom: "Constance" });
  assert.equal(correct.statut, 201);
});
