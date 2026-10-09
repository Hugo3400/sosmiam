// Tests du rôle pro réservé aux 18 ans et plus, côté serveur : demander un rattachement, accepter une invitation, routes
// /pro/… et /miam-safe/pro/… (403 reserve-aux-majeurs), inviter un compte mineur (409 compte-mineur), compte du site sans
// date (passe), date illisible faute de clé (503). Tout en mémoire, avec une clé de TEST : aucune base.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import type { AddressInfo } from "node:net";
import { after, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import { MESSAGE_COMPTE_MINEUR } from "../src/controleurs/pro-equipe.ts";
import { lireMajoriteCompte } from "../src/fonctions/comptes/lire-majorite-compte.ts";
import { creerChiffrementDonnees, type ChiffrementDonnees } from "../src/services/chiffrement-donnees.ts";
import { creerComptesEnMemoire } from "../src/services/comptes-en-memoire.ts";
import { creerMiamSafeEnMemoire } from "../src/services/miam-safe-en-memoire.ts";
import { FICHE_TEST } from "./outils/creer-banc-pro.ts";

const MOT_DE_PASSE = "mon chat adore les croissants";
const horloge = Date.parse("2026-10-09T10:00:00Z");
const chiffrement = creerChiffrementDonnees(randomBytes(32));

/** Une API en mémoire ; `cle` : le chiffrement que voit l'API (null : clé absente) */
async function creerBanc(cle: ChiffrementDonnees | null) {
  const memoire = creerComptesEnMemoire(() => horloge);
  const miamSafe = creerMiamSafeEnMemoire((lieuId) => memoire.lieux.get(lieuId)?.statut === "publie");
  const serveur = creerApplication({
    enregistrerInscription: async () => {},
    comptes: {
      services: memoire.services, sessions: memoire.sessions, zones: memoire.zones, courriels: memoire.courriels, pro: memoire.pro,
      horloge: () => horloge, chiffrement: cle,
    },
    miamSafe: { services: miamSafe.services, prevenirEquipe: async () => {} },
  }).listen(0, "127.0.0.1");
  await new Promise<void>((pret) => serveur.once("listening", () => pret()));
  const adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  let visiteur = 0;
  async function demander(methode: string, chemin: string, jeton?: string, corps?: unknown) {
    const reponse = await fetch(`${adresse}${chemin}`, {
      method: methode,
      headers: { "X-IP-Visiteur": `visiteur-${++visiteur}`, "Content-Type": "application/json", ...(jeton ? { "X-Session-Compte": jeton } : {}) },
      body: corps === undefined ? undefined : JSON.stringify(corps),
    });
    return { statut: reponse.status, corps: (await reponse.json()) as Record<string, any> };
  }
  let numero = 0;
  let prochainLieu = 700;
  /** Un compte de l'app (date gardée) ou du site (espace « pro », sans date gardée) */
  async function inscrire(espace: "app" | "pro", dateNaissance = "2000-01-31") {
    const email = `mineurs${++numero}@exemple.fr`;
    const reponse = await demander("POST", "/comptes", undefined, { email, motDePasse: MOT_DE_PASSE, prenom: "Zoé", dateNaissance, ville: "Nantes", cgu: true, espace });
    assert.equal(reponse.statut, 201, JSON.stringify(reponse.corps));
    const id = [...memoire.comptes.values()].find((compte) => compte.email === email)?.id ?? 0;
    return { id, email, jeton: reponse.corps.session as string };
  }
  function ajouterLieu() {
    const id = ++prochainLieu;
    memoire.lieux.set(id, structuredClone(FICHE_TEST));
    return id;
  }
  /** Rattachement validé posé directement (l'API le refuse sous 18 ans) */
  function poserValide(compteId: number, lieuId = ajouterLieu(), role: "gerant" | "equipe" = "gerant") {
    const id = Math.max(0, ...memoire.rattachements.map((r) => r.id)) + 1;
    memoire.rattachements.push({ id, lieuId, compteId, role, preuve: "Test.", siret: null, statut: "valide", reponse: null, creeLe: horloge, decideLe: horloge });
    return lieuId;
  }
  return { memoire, demander, inscrire, ajouterLieu, poserValide, fermer: () => new Promise<void>((fini) => serveur.close(() => fini())) };
}

const banc = await creerBanc(chiffrement);
after(banc.fermer);
const { demander, inscrire, ajouterLieu, poserValide, memoire } = banc;
const RESERVE = { ok: false, erreur: "reserve-aux-majeurs" };

test("lireMajoriteCompte : sans date → majeur ; 17 ans → mineur ; 18 ans pile (jour de Paris) → majeur ; sans clé → illisible", () => {
  const maintenant = new Date(horloge);
  const date = (texte: string) => chiffrement.chiffrer(texte, "dateNaissance");
  assert.equal(lireMajoriteCompte(null, null, maintenant), "majeur");
  assert.equal(lireMajoriteCompte(date("2008-10-10"), chiffrement, maintenant), "mineur");
  assert.equal(lireMajoriteCompte(date("2008-10-09"), chiffrement, maintenant), "majeur");
  assert.equal(lireMajoriteCompte(date("2008-10-09"), null, maintenant), "illisible");
  assert.equal(lireMajoriteCompte(date("2008-10-09"), creerChiffrementDonnees(randomBytes(32)), maintenant), "illisible", "clé fausse");
});

test("15-17 ans : demander un rattachement → 403 reserve-aux-majeurs, rien n'est gardé ; lister et quitter restent ouverts", async () => {
  const mineur = await inscrire("app", "2010-06-01");
  const avant = memoire.rattachements.length;
  const demande = await demander("POST", "/comptes/moi/rattachements", mineur.jeton, { lieuId: ajouterLieu(), role: "gerant", preuve: "Je suis le gérant." });
  assert.deepEqual([demande.statut, demande.corps], [403, RESERVE]);
  assert.equal(memoire.rattachements.length, avant);
  assert.deepEqual((await demander("GET", "/comptes/moi/rattachements", mineur.jeton)).corps, { ok: true, rattachements: [] });
  const lieuId = poserValide(mineur.id);
  const garde = memoire.rattachements.find((r) => r.lieuId === lieuId);
  assert.equal((await demander("DELETE", `/comptes/moi/rattachements/${garde?.id}`, mineur.jeton)).statut, 200, "quitter un lieu reste possible");
});

test("15-17 ans avec un rattachement validé quand même : /pro/… et /miam-safe/pro/… → 403 ; ses alertes restent ouvertes", async () => {
  const mineur = await inscrire("app", "2009-12-31");
  const lieuId = poserValide(mineur.id);
  for (const [methode, chemin] of [
    ["GET", `/pro/lieux/${lieuId}`], ["PATCH", `/pro/lieux/${lieuId}`], ["GET", `/pro/lieux/${lieuId}/equipe`],
    ["GET", `/pro/lieux/${lieuId}/carte`], ["GET", "/pro/recherche-lieux?texte=chez"], ["GET", `/pro/lieux/${lieuId + 999}`],
    ["GET", `/miam-safe/pro/lieux/${lieuId}/alertes`], ["GET", `/miam-safe/pro/lieux/${lieuId}/charte`], ["PUT", `/miam-safe/pro/lieux/${lieuId}/charte`],
  ] as const) {
    const reponse = await demander(methode, chemin, mineur.jeton, methode === "GET" ? undefined : {});
    assert.deepEqual([reponse.statut, reponse.corps], [403, RESERVE], `${methode} ${chemin}`);
  }
  // Le côté client de Miam Safe n'est pas un rôle : il reste ouvert à tous
  const lecture = await demander("GET", `/miam-safe/lieux/${lieuId}`);
  assert.equal(lecture.statut, 200);
  const alerte = await demander("POST", "/miam-safe/alertes", mineur.jeton, { lieuId, endroit: "salle" });
  assert.equal(alerte.statut, 409, "pas de charte : pas-miam-safe, pas un refus d'âge");
  assert.equal(alerte.corps.erreur, "pas-miam-safe");
});

test("inviter un compte mineur → 409 compte-mineur (sans son âge) ; un mineur ne peut pas accepter une invitation", async () => {
  const gerant = await inscrire("app", "1990-01-01");
  const lieuId = poserValide(gerant.id);
  const mineur = await inscrire("app", "2010-01-01");
  const invitation = await demander("POST", `/pro/lieux/${lieuId}/equipe`, gerant.jeton, { email: mineur.email });
  assert.deepEqual([invitation.statut, invitation.corps], [409, { ok: false, erreur: "compte-mineur", message: MESSAGE_COMPTE_MINEUR }]);
  assert.doesNotMatch(MESSAGE_COMPTE_MINEUR, /1[5-7]/, "jamais l'âge exact");
  assert.equal(memoire.rattachements.some((r) => r.compteId === mineur.id), false);

  // Une invitation qui existait déjà (avant une correction de date, par exemple) ne s'accepte pas
  const id = Math.max(...memoire.rattachements.map((r) => r.id)) + 1;
  memoire.rattachements.push({ id, lieuId, compteId: mineur.id, role: "equipe", preuve: "Test.", siret: null, statut: "en-attente", reponse: null, creeLe: horloge, decideLe: null });
  const acceptee = await demander("POST", `/comptes/moi/rattachements/${id}/accepter`, mineur.jeton);
  assert.deepEqual([acceptee.statut, acceptee.corps], [403, RESERVE]);
  assert.equal(memoire.rattachements.find((r) => r.id === id)?.statut, "en-attente");

  // Majeur de l'app, puis compte du site sans date : invitation, acceptation, fiche ouverte
  for (const invite of [await inscrire("app", "2008-10-09"), await inscrire("pro")]) {
    assert.equal((await demander("POST", `/pro/lieux/${lieuId}/equipe`, gerant.jeton, { email: invite.email })).statut, 201);
    const garde = memoire.rattachements.find((r) => r.compteId === invite.id && r.lieuId === lieuId);
    assert.equal((await demander("POST", `/comptes/moi/rattachements/${garde?.id}/accepter`, invite.jeton)).statut, 200);
    assert.equal((await demander("GET", `/pro/lieux/${lieuId}`, invite.jeton)).statut, 200);
  }
});

test("compte du site (sans date gardée) et 18 ans pile : demander un rattachement passe", async () => {
  const site = await inscrire("pro");
  assert.equal((await demander("POST", "/comptes/moi/rattachements", site.jeton, { lieuId: ajouterLieu(), role: "gerant", preuve: "Gérante." })).statut, 201);
  const pile = await inscrire("app", "2008-10-09");
  assert.equal((await demander("POST", "/comptes/moi/rattachements", pile.jeton, { lieuId: ajouterLieu(), role: "gerant", preuve: "Gérant." })).statut, 201);
});

test("date gardée mais clé absente : 503 chiffrement-indisponible (pas un refus) ; un compte du site passe", async () => {
  const sansCle = await creerBanc(null);
  try {
    // Le compte de l'app est créé avec la clé, puis l'API « redémarre » sans elle : on recopie le compte gardé
    const avecDate = await inscrire("app", "1990-01-01");
    const garde = memoire.comptes.get(avecDate.id);
    assert.ok(garde?.dateNaissanceChiffree);
    const site = await sansCle.inscrire("pro");
    const copie = sansCle.memoire.comptes.get(site.id);
    assert.ok(copie);
    copie.dateNaissanceChiffree = garde.dateNaissanceChiffree;
    const lieuId = sansCle.poserValide(site.id);
    const fiche = await sansCle.demander("GET", `/pro/lieux/${lieuId}`, site.jeton);
    assert.deepEqual([fiche.statut, fiche.corps], [503, { ok: false, erreur: "chiffrement-indisponible" }]);
    const demande = await sansCle.demander("POST", "/comptes/moi/rattachements", site.jeton, { lieuId: sansCle.ajouterLieu(), role: "gerant", preuve: "x" });
    assert.equal(demande.statut, 503);

    // Le gérant (compte du site, sans date) passe ; inviter un compte dont la date ne se lit pas : 503
    const gerant = await sansCle.inscrire("pro");
    const sonLieu = sansCle.poserValide(gerant.id);
    assert.equal((await sansCle.demander("GET", `/pro/lieux/${sonLieu}`, gerant.jeton)).statut, 200);
    const invitation = await sansCle.demander("POST", `/pro/lieux/${sonLieu}/equipe`, gerant.jeton, { email: site.email });
    assert.deepEqual([invitation.statut, invitation.corps], [503, { ok: false, erreur: "chiffrement-indisponible" }]);
  } finally {
    await sansCle.fermer();
  }
});
