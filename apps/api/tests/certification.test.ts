// Tests de la candidature « ambassadeur certifié » depuis l'espace (décision du 9 octobre 2026) : réservée aux
// ambassadeurs actifs, champs vérifiés un par un, une seule en attente, recandidater après un refus ou un titre retiré,
// le titre dans le compte, et le ménage des candidatures refusées (3 mois). Services en mémoire : aucune base touchée.
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import { reculerDeMois } from "../src/fonctions/dates/reculer-de-mois.ts";
import { calculerEmpreinteJeton } from "../src/fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../src/fonctions/securite/creer-jeton.ts";
import { creerComptesEnMemoire } from "../src/services/comptes-en-memoire.ts";
import type { CompteConnecte, StatutAmbassadeur } from "../src/services/comptes.ts";

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

type Corps = { ok: boolean; erreur?: string; champ?: string; certifie?: unknown; candidature?: Record<string, unknown> | null; compte?: CompteConnecte };
let visiteur = 0;
async function demander(methode: string, chemin: string, jeton: string, corps?: unknown) {
  const reponse = await fetch(`${adresse}${chemin}`, {
    method: methode,
    headers: { "X-IP-Visiteur": `visiteur-${++visiteur}`, "X-Session-Compte": jeton, ...(corps === undefined ? {} : { "Content-Type": "application/json" }) },
    ...(corps === undefined ? {} : { body: JSON.stringify(corps) }),
  });
  return { statut: reponse.status, corps: (await reponse.json()) as Corps };
}

let numero = 0;
async function creerCompteEtSession(statut: StatutAmbassadeur = "actif") {
  const id = await memoire.services.creerCompte({
    email: `certifie${++numero}@exemple.fr`, motDePasse: "scrypt$factice", prenom: "Marie", ville: "Lyon", quartier: null, cguVersion: "2026-10-08",
  });
  if (id === null) throw new Error("compte de test impossible");
  if (statut !== "en-attente") await memoire.decider(id, statut);
  const jeton = creerJeton();
  await memoire.sessions.creer(calculerEmpreinteJeton(jeton), { compteId: id, creeLe: horloge, activite: horloge });
  const lire = async () => (await demander("GET", "/comptes/moi/certification", jeton)).corps;
  const candidater = (corps: Record<string, unknown>) => demander("POST", "/comptes/moi/certification", jeton, corps);
  const lireCompte = async () => (await demander("GET", "/comptes/session", jeton)).corps.compte;
  return { id, jeton, lire, candidater, lireCompte };
}

const CANDIDATURE = {
  profil: "structure", structure: "Les Gourmands du 11e", communeCode: "69123",
  aide: "On organise des balades gourmandes\r\net on parle des lieux du quartier.", envies: ["presenter", "fiche"], engagementGratuit: true,
};
const LYON = { code: "69123", nom: "Lyon", nomDepartement: "Rhône" };
const invalide = (champ: string) => ({ statut: 400, corps: { ok: false, erreur: "champ-invalide", champ } });

test("réservée aux ambassadeurs actifs (403 ambassadeur-non-actif sinon)", async () => {
  for (const statut of ["en-attente", "refuse", "suspendu"] as const) {
    const { jeton, id } = await creerCompteEtSession(statut);
    for (const methode of ["GET", "POST"]) {
      const reponse = await demander(methode, "/comptes/moi/certification", jeton, methode === "POST" ? CANDIDATURE : undefined);
      assert.deepEqual([reponse.statut, reponse.corps], [403, { ok: false, erreur: "ambassadeur-non-actif" }], `${statut} ${methode}`);
    }
    assert.equal(memoire.candidaturesCertification.some((c) => c.compteId === id), false);
  }
  assert.equal((await demander("GET", "/comptes/moi/certification", creerJeton())).statut, 401);
});

test("au départ : pas de titre ni de candidature, et le compte dit certifie: null", async () => {
  const { lire, lireCompte } = await creerCompteEtSession();
  assert.deepEqual(await lire(), { ok: true, certifie: null, candidature: null });
  assert.equal((await lireCompte())?.ambassadeur?.certifie, null);
});

test("chaque champ est vérifié, dans l'ordre du formulaire (400 champ-invalide et son nom), et rien n'est gardé", async () => {
  const { id, candidater } = await creerCompteEtSession();
  const cas: [string, Record<string, unknown>][] = [
    ["profil", { profil: undefined }], ["profil", { profil: "chef" }], ["profil", { profil: ["pro"] }],
    ["structure", { structure: "x".repeat(101) }], ["structure", { structure: 12 }],
    ["communeCode", { communeCode: undefined }], ["communeCode", { communeCode: "" }], ["communeCode", { communeCode: "99999" }],
    ["communeCode", { communeCode: "ABCDE" }], ["communeCode", { communeCode: 69123 }],
    ["aide", { aide: undefined }], ["aide", { aide: "" }], ["aide", { aide: "  \r\n \t " }], ["aide", { aide: "x".repeat(601) }], ["aide", { aide: 42 }],
    ["envies", { envies: [] }], ["envies", { envies: undefined }], ["envies", { envies: ["fiche", "cuisiner"] }], ["envies", { envies: "fiche" }],
    ["engagementGratuit", { engagementGratuit: false }], ["engagementGratuit", { engagementGratuit: undefined }], ["engagementGratuit", { engagementGratuit: "true" }],
    // Deux champs faux : le premier du formulaire est nommé
    ["profil", { profil: "chef", aide: "" }], ["communeCode", { communeCode: "00000", engagementGratuit: false }],
  ];
  for (const [champ, changement] of cas) {
    assert.deepEqual(await candidater({ ...CANDIDATURE, ...changement }), invalide(champ), JSON.stringify(changement));
  }
  assert.equal(memoire.candidaturesCertification.some((c) => c.compteId === id), false);
});

test("bornes : structure de 100 caractères, aide de 600 avec \\r\\n compté comme un saut de ligne, une seule envie", async () => {
  const { candidater } = await creerCompteEtSession();
  const aide = `${"a".repeat(299)}\r\n${"b".repeat(300)}`; // 601 caractères reçus, 600 une fois \r\n ramené à \n
  const reponse = await candidater({ ...CANDIDATURE, structure: "s".repeat(100), aide, envies: ["big-sos"] });
  assert.deepEqual([reponse.statut, reponse.corps], [201, { ok: true }]);
  const gardee = memoire.candidaturesCertification.at(-1);
  assert.equal(gardee?.aide, `${"a".repeat(299)}\n${"b".repeat(300)}`);
  assert.equal(gardee?.structure, "s".repeat(100));
});

test("le champ piège rempli : 201, et rien n'est gardé", async () => {
  const { id, candidater, lire } = await creerCompteEtSession();
  assert.deepEqual(await candidater({ piege: "https://spam.example", profil: "n'importe quoi" }), { statut: 201, corps: { ok: true } });
  assert.equal(memoire.candidaturesCertification.some((c) => c.compteId === id), false);
  assert.equal((await lire()).candidature, null);
});

test("candidater, puis 409 candidature-existante tant qu'elle attend ; ce que la personne voit", async () => {
  const { id, candidater, lire } = await creerCompteEtSession();
  const reponse = await candidater({ ...CANDIDATURE, communeCode: " 69383 ", structure: "  Les   Gourmands du 11e ", envies: ["presenter", "fiche", "fiche"] });
  assert.deepEqual([reponse.statut, reponse.corps], [201, { ok: true }]);
  const gardee = memoire.candidaturesCertification.at(-1);
  assert.equal(gardee?.compteId, id);
  // Commune ramenée à la ville (Lyon 3e → Lyon), structure nettoyée, envies sans doublon et dans l'ordre du formulaire
  assert.deepEqual([gardee?.communeCode, gardee?.structure, gardee?.envies, gardee?.engagementGratuit], ["69123", "Les Gourmands du 11e", ["fiche", "presenter"], true]);
  assert.equal(gardee?.aide, "On organise des balades gourmandes\net on parle des lieux du quartier.");
  assert.deepEqual(await lire(), {
    ok: true, certifie: null,
    candidature: {
      statut: "en-attente", profil: "structure", structure: "Les Gourmands du 11e", commune: LYON, envies: ["fiche", "presenter"],
      creeLe: new Date(horloge).toISOString(), reponduLe: null,
    },
  });
  assert.deepEqual(await candidater({ ...CANDIDATURE, profil: "pro" }), { statut: 409, corps: { ok: false, erreur: "candidature-existante" } });
  assert.equal(memoire.candidaturesCertification.filter((c) => c.compteId === id).length, 1);
});

test("structure facultative : absente, null ou vide, elle vaut null", async () => {
  for (const structure of [undefined, null, "   "]) {
    const { candidater, lire } = await creerCompteEtSession();
    assert.equal((await candidater({ ...CANDIDATURE, profil: "ambassadeur", structure })).statut, 201);
    assert.equal((await lire()).candidature?.structure, null);
  }
});

test("après un refus, on recandidate tout de suite", async () => {
  const { id, candidater, lire } = await creerCompteEtSession();
  assert.equal((await candidater(CANDIDATURE)).statut, 201);
  horloge += 3_600_000;
  assert.equal(memoire.repondreCertification(id, "refuser"), true);
  const apresRefus = await lire();
  assert.deepEqual([apresRefus.certifie, apresRefus.candidature?.statut, apresRefus.candidature?.reponduLe], [null, "refusee", new Date(horloge).toISOString()]);
  assert.equal((await candidater({ ...CANDIDATURE, profil: "pro", structure: "Boulangerie Rose" })).statut, 201);
  assert.deepEqual([(await lire()).candidature?.statut, (await lire()).candidature?.profil], ["en-attente", "pro"]);
});

test("acceptée : le titre apparaît (GET et compte), 409 deja-certifie ; titre retiré : on peut recandidater", async () => {
  const { id, candidater, lire, lireCompte } = await creerCompteEtSession();
  assert.equal((await candidater(CANDIDATURE)).statut, 201);
  horloge += 60_000;
  assert.equal(memoire.repondreCertification(id, "accepter"), true);
  const certifie = { depuis: new Date(horloge).toISOString(), profil: "structure", structure: "Les Gourmands du 11e" };
  const vue = await lire();
  assert.deepEqual([vue.certifie, vue.candidature?.statut], [certifie, "acceptee"]);
  assert.deepEqual((await lireCompte())?.ambassadeur?.certifie, certifie);
  assert.deepEqual(await candidater(CANDIDATURE), { statut: 409, corps: { ok: false, erreur: "deja-certifie" } });
  // L'équipe retire le titre : plus de certifié, et une nouvelle candidature passe
  assert.equal(memoire.repondreCertification(id, "retirer"), true);
  assert.equal(memoire.repondreCertification(id, "retirer"), false, "déjà retiré");
  assert.deepEqual([(await lire()).certifie, (await lireCompte())?.ambassadeur?.certifie], [null, null]);
  assert.equal((await candidater(CANDIDATURE)).statut, 201);
});

test("une décision sans candidature en attente ne change rien", async () => {
  const { id } = await creerCompteEtSession();
  assert.equal(memoire.repondreCertification(id, "accepter"), false);
  assert.equal(memoire.repondreCertification(id, "refuser"), false);
  assert.equal(memoire.repondreCertification(9999, "accepter"), false);
});

test("compte effacé : ses candidatures certification partent avec lui", async () => {
  const { id, candidater } = await creerCompteEtSession();
  assert.equal((await candidater(CANDIDATURE)).statut, 201);
  await memoire.services.effacerCompte(id);
  assert.equal(memoire.candidaturesCertification.some((c) => c.compteId === id), false);
});

test("ménage de nuit : une candidature refusée est effacée 3 mois après la réponse, pas avant ; les autres restent", async () => {
  memoire.candidaturesCertification.length = 0;
  const reponse = Date.parse("2026-06-15T12:00:00Z");
  const base = { profil: "ambassadeur" as const, structure: null, communeCode: "69123", aide: "Je file des coups de main.", envies: ["fiche"], engagementGratuit: true as const };
  memoire.candidaturesCertification.push(
    { ...base, id: 901, compteId: 1, statut: "refusee", creeLe: reponse, reponduLe: reponse },
    { ...base, id: 902, compteId: 2, statut: "refusee", creeLe: reponse, reponduLe: reponse + 2 * 86_400_000 },
    { ...base, id: 903, compteId: 3, statut: "acceptee", creeLe: reponse, reponduLe: reponse },
    { ...base, id: 904, compteId: 4, statut: "en-attente", creeLe: reponse, reponduLe: null },
  );
  // Le 15 septembre à midi : pile 3 mois, rien ne part encore
  assert.equal(memoire.effacerCertificationsRefusees(new Date("2026-09-15T12:00:00Z")), 0);
  assert.equal(memoire.effacerCertificationsRefusees(new Date("2026-09-16T12:00:00Z")), 1);
  assert.deepEqual(memoire.candidaturesCertification.map((c) => c.id), [902, 903, 904]);
  assert.equal(memoire.effacerCertificationsRefusees(new Date("2027-06-01T00:00:00Z")), 1);
  assert.deepEqual(memoire.candidaturesCertification.map((c) => c.id), [903, 904]);
});

test("reculerDeMois : 3 mois plus tôt sur le calendrier", () => {
  assert.equal(reculerDeMois(new Date("2026-10-09T10:00:00Z"), 3).toISOString(), "2026-07-09T10:00:00.000Z");
  assert.equal(reculerDeMois(new Date("2026-01-15T10:00:00Z"), 3).toISOString(), "2025-10-15T10:00:00.000Z");
  const avant = new Date("2026-10-09T10:00:00Z");
  reculerDeMois(avant, 3);
  assert.equal(avant.toISOString(), "2026-10-09T10:00:00.000Z", "la date reçue n'est pas changée");
});
