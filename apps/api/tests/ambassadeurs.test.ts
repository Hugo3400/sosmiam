// Tests des routes de gestion des ambassadeurs (et des routes de leur espace), avec de faux services, sans base.
import assert from "node:assert/strict";
import { createHash, randomBytes, webcrypto } from "node:crypto";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import { calculerCodeTotp } from "../src/fonctions/securite/calculer-code-totp.ts";
import { calculerIdPoste } from "../src/fonctions/securite/calculer-id-poste.ts";
import { construireMessageGestion } from "../src/fonctions/securite/construire-message-gestion.ts";
import { creerStockageSessionsEnMemoire } from "../src/middlewares/proteger-gestion.ts";
import type { AccesGestion } from "../src/services/gestion/acces.ts";
import type { ServicesGestion } from "../src/services/gestion/tous-les-services.ts";

const { subtle } = webcrypto;
const secretTotp = new Uint8Array(randomBytes(20));
let horloge = Date.now();
const cles = (await subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as webcrypto.CryptoKeyPair;
const clePublique = new Uint8Array(await subtle.exportKey("raw", cles.publicKey));
const autreCle = (await subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as webcrypto.CryptoKeyPair;
const idPoste = calculerIdPoste(clePublique);
let acces: AccesGestion | null = { postes: [{ id: idPoste, nom: "PC de test", clePublique }], secretTotp };

const actions: string[] = [];
const LYON = { code: "69123", type: "ville", nom: "Lyon", nomAvecDe: "de Lyon", places: 10 };
const appels: unknown[] = [];
const services = {
  noterAction: async (_poste: string, action: string) => void actions.push(action),
  lirePrenom: async (id: number) => (id === 7 ? "Léa" : id === 6 ? "Sam" : null),
  deciderAmbassadeur: async (id: number, statut: string) => (id === 7 ? (appels.push({ decider: statut }), { prenom: "Léa", avant: "en-attente" }) : null),
  prevenirAmbassadeurValide: async (id: number) => (appels.push({ bienvenue: id }), true),
  envoyerLienMotDePasse: async (id: number, lien: string) => (appels.push({ lienEnvoye: id, lien }), { ok: true }),
  retirerDuProgramme: async (id: number) => (id === 7 ? (appels.push("retire"), { prenom: "Léa" }) : null),
  accepterCandidature: async (id: number) =>
    id === 1 ? { etat: "acceptee", compteId: 7, numeroLocal: 3, numeroNational: 147, zone: LYON }
      : id === 2 ? { etat: "complet", zone: LYON }
        : id === 4 ? { etat: "sans-zone" }
          : { etat: "introuvable" },
  choisirCommuneCandidature: async (id: number, code: string) => (appels.push({ commune: code }), id === 4 && code === "69383" ? { commune: "Lyon", zone: LYON } : null),
  libererPlaceFondateur: async (id: number) => (id === 1 ? { compteId: 7, zone: LYON, encoreFondateurDeVille: false } : null),
  estFondateurDeVille: async (id: number) => id === 7,
  creerMission: async (saisie: { compteId: number; titre: string }) => (saisie.compteId === 7 ? { id: 1, ...saisie, compte: { prenom: "Léa" } } : null),
  accepterDemande: async () => ({ id: 5, nom: "Le Petit Four", statut: "brouillon", compteIdAuteur: 7 }),
} as unknown as ServicesGestion;
const comptes = {
  ajouterPoints: async (compteId: number, points: number, raison: string, detail?: string) => (appels.push({ points: compteId, valeur: points, raison, detail }), { points: 130, palier: "denicheur" }),
  donnerBadge: async (compteId: number, badge: string) => (appels.push({ badge, compteId }), true),
  preparerReinitialisation: async () => ({ jeton: "jeton-secret", expireLe: new Date("2026-10-10T12:00:00Z") }),
  nommerAmbassadeurVille: async () => void appels.push("ville"),
  retirerAmbassadeurVille: async () => (appels.push("plus-ville"), "denicheur"),
};

let adresse = "";
const sessionsGardees = creerStockageSessionsEnMemoire();
const serveur = creerApplication({
  enregistrerInscription: async () => {},
  gestion: { lireAcces: () => acces, services, horloge: () => horloge, sessions: sessionsGardees, comptes },
}).listen(0, "127.0.0.1");
before(() => new Promise<void>((pret) => serveur.once("listening", () => {
  adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  pret();
})));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));

type Options = { session?: string | null; corps?: string; cle?: webcrypto.CryptoKey; nonce?: string; horodatage?: number; falsifier?: boolean };
async function demander(methode: string, chemin: string, options: Options = {}) {
  const corps = options.corps ?? "";
  const nonce = options.nonce ?? randomBytes(16).toString("base64url");
  const horodatage = String(options.horodatage ?? horloge);
  const message = construireMessageGestion({
    methode, chemin, horodatage, nonce, session: options.session ?? null,
    empreinteCorps: createHash("sha256").update(corps).digest("hex"),
  });
  const signature = Buffer.from(await subtle.sign("Ed25519", options.cle ?? cles.privateKey, Buffer.from(message))).toString("base64url");
  return fetch(`${adresse}/api-gestion${chemin}`, {
    method: methode,
    headers: {
      "Content-Type": "application/json",
      "X-Gestion-Poste": idPoste,
      "X-Gestion-Horodatage": horodatage,
      "X-Gestion-Nonce": nonce,
      "X-Gestion-Signature": signature,
      ...(options.session ? { "X-Gestion-Session": options.session } : {}),
    },
    ...(corps ? { body: options.falsifier ? corps.replace("a", "b") : corps } : {}),
  });
}
const codeActuel = () => calculerCodeTotp(secretTotp, Math.floor(horloge / 30_000));
async function ouvrirSession() {
  horloge += 30_000; // un code ne sert qu'une fois : on passe au pas suivant
  const reponse = await demander("POST", "/session", { corps: JSON.stringify({ code: codeActuel() }) });
  assert.equal(reponse.status, 201);
  return ((await reponse.json()) as { session: string }).session;
}


import express from "express";
import { creerRoutesEspaceAmbassadeur } from "../src/routes/espace-ambassadeur.ts";

const json = (corps: unknown) => JSON.stringify(corps);

test("décisions : seuls actif, refuse et suspendu ; un compte inconnu est introuvable", async () => {
  const session = await ouvrirSession();
  assert.equal((await demander("POST", "/ambassadeurs/7/decision", { session, corps: json({ statut: "actif" }) })).status, 200);
  assert.ok(actions.includes("Ambassadeur validé"));
  assert.ok(appels.some((appel) => (appel as { bienvenue?: number }).bienvenue === 7), "le mail de bienvenue part à la validation");
  assert.equal((await demander("POST", "/ambassadeurs/7/decision", { session, corps: json({ statut: "roi" }) })).status, 400);
  assert.equal((await demander("POST", "/ambassadeurs/9/decision", { session, corps: json({ statut: "actif" }) })).status, 404);
});

test("retirer du programme : le rôle part, le compte (et l'app) reste ; un compte inconnu est introuvable", async () => {
  const session = await ouvrirSession();
  assert.equal((await demander("POST", "/ambassadeurs/7/retirer", { session, corps: json({}) })).status, 200);
  assert.ok(appels.includes("retire"));
  assert.ok(actions.includes("Retiré du programme ambassadeur"));
  assert.equal((await demander("POST", "/ambassadeurs/9/retirer", { session, corps: json({}) })).status, 404);
});

test("points : un motif est obligatoire, et la règle passe par ajouterPoints (raison « equipe »)", async () => {
  const session = await ouvrirSession();
  assert.equal((await demander("POST", "/ambassadeurs/7/points", { session, corps: json({ points: 50 }) })).status, 400);
  assert.equal((await demander("POST", "/ambassadeurs/7/points", { session, corps: json({ points: 0, detail: "rien" }) })).status, 400);
  const reponse = await demander("POST", "/ambassadeurs/7/points", { session, corps: json({ points: 50, detail: "Super vidéo" }) });
  assert.equal(reponse.status, 200);
  assert.deepEqual(appels.at(-1), { points: 7, valeur: 50, raison: "equipe", detail: "Super vidéo" });
});

test("palier de ville, réinitialisation et candidature fondateur", async () => {
  const session = await ouvrirSession();
  assert.deepEqual(await (await demander("POST", "/ambassadeurs/7/palier-ville", { session, corps: json({ ville: false }) })).json(), { ok: true, palier: "denicheur" });
  const lien = (await (await demander("POST", "/ambassadeurs/7/reinitialiser", { session, corps: "{}" })).json()) as { lien: string };
  assert.equal(lien.lien, "https://ambassadeur.sosmiam.fr/nouveau-mot-de-passe#jeton=jeton-secret");
  assert.equal((await demander("POST", "/ambassadeurs/9/reinitialiser", { session, corps: "{}" })).status, 404);
  // Envoyé par mail : le lien part à son adresse et ne revient pas au logiciel
  const envoye = (await (await demander("POST", "/ambassadeurs/7/reinitialiser", { session, corps: json({ envoyer: true }) })).json()) as Record<string, unknown>;
  assert.equal(envoye.envoye, true);
  assert.equal(envoye.lien, undefined);
  assert.deepEqual(appels.at(-1), { lienEnvoye: 7, lien: "https://ambassadeur.sosmiam.fr/nouveau-mot-de-passe#jeton=jeton-secret" });
});

test("fondateurs par ville : deux numéros, zone complète, sans zone, commune, place libérée, ambassadeur de ville", async () => {
  const session = await ouvrirSession();
  assert.deepEqual(await (await demander("POST", "/candidatures/1/accepter", { session, corps: "{}" })).json(), { ok: true, numeroLocal: 3, numeroNational: 147, zone: LYON });
  assert.deepEqual(appels.at(-1), { badge: "fondateur", compteId: 7 });
  // Le journal garde le numéro national et le compte, jamais la commune ni le prénom
  assert.equal(actions.at(-1), "Candidature fondateur acceptée");
  const complet = await demander("POST", "/candidatures/2/accepter", { session, corps: "{}" });
  assert.equal(complet.status, 409);
  assert.deepEqual(await complet.json(), { ok: false, erreur: "zone-complete", zone: LYON });
  assert.deepEqual(await (await demander("POST", "/candidatures/4/accepter", { session, corps: "{}" })).json(), { ok: false, erreur: "sans-zone" });
  assert.equal((await demander("POST", "/candidatures/9/accepter", { session, corps: "{}" })).status, 404);
  // Commune : un code INSEE (Corse et outre-mer compris), rien d'autre
  assert.equal((await demander("POST", "/candidatures/4/commune", { session, corps: json({ commune: "Lyon" }) })).status, 400);
  assert.equal((await demander("POST", "/candidatures/4/commune", { session, corps: json({ commune: "2A004" }) })).status, 404);
  assert.deepEqual(appels.at(-1), { commune: "2A004" });
  assert.deepEqual(await (await demander("POST", "/candidatures/4/commune", { session, corps: json({ commune: "69383" }) })).json(), { ok: true, commune: "Lyon", zone: LYON });
  assert.deepEqual(await (await demander("POST", "/candidatures/1/liberer", { session, corps: "{}" })).json(), { ok: true, encoreFondateurDeVille: false });
  assert.equal((await demander("POST", "/candidatures/2/liberer", { session, corps: "{}" })).status, 404);
  // Ambassadeur de ville : seulement un fondateur en place d'une ville
  assert.equal((await demander("POST", "/ambassadeurs/7/palier-ville", { session, corps: json({ ville: true }) })).status, 200);
  assert.equal(appels.at(-1), "ville");
  const pasFondateur = await demander("POST", "/ambassadeurs/6/palier-ville", { session, corps: json({ ville: true }) });
  assert.equal(pasFondateur.status, 409);
  assert.deepEqual(await pasFondateur.json(), { ok: false, erreur: "pas-fondateur-de-ville" });
  // Retirer le rôle reste toujours possible
  assert.equal((await demander("POST", "/ambassadeurs/6/palier-ville", { session, corps: json({ ville: false }) })).status, 200);
});

test("missions : titre obligatoire, seulement pour un ambassadeur actif", async () => {
  const session = await ouvrirSession();
  assert.equal((await demander("POST", "/missions", { session, corps: json({ compteId: 7 }) })).status, 400);
  assert.equal((await demander("POST", "/missions", { session, corps: json({ compteId: 7, titre: "Vérifier La Fournée" }) })).status, 201);
  assert.equal((await demander("POST", "/missions", { session, corps: json({ compteId: 8, titre: "Vérifier" }) })).status, 400);
});

test("un lieu proposé par un ambassadeur, accepté : +30 points « proposer-lieu » et le badge du premier lieu", async () => {
  const session = await ouvrirSession();
  const lieu = { nom: "Le Petit Four", type: "patisserie", emoji: "🥐", info: "Pâtisserie", texte: "Des choux.", quartier: "Écusson", ville: "Sète", prix: "€", couleurs: ["#FFD60A", "#FF4D3D"], horaires: "Tous les jours", plat: "Choux", statut: "brouillon" };
  assert.equal((await demander("POST", "/demandes/5/accepter", { session, corps: json({ lieu, reponse: "" }) })).status, 201);
  assert.deepEqual(appels.slice(-2), [{ points: 7, valeur: 30, raison: "proposer-lieu", detail: "Le Petit Four" }, { badge: "deniche-par-toi", compteId: 7 }]);
});

test("espace ambassadeur : missions et messages du compte connecté", async () => {
  const faits: unknown[] = [];
  const espace = express();
  espace.use(express.json());
  espace.use((_requete, reponse, suite) => { reponse.locals.compte = { id: 7 }; suite(); });
  espace.use("/espace-ambassadeur", creerRoutesEspaceAmbassadeur({
    missionsDuCompte: (async () => [{ id: 1, titre: "Vérifier" }]) as never,
    terminerMission: (async (compteId: number, id: number, texte: string) => (faits.push({ compteId, id, texte }), id === 1)) as never,
    messagesDuCompte: (async () => []) as never,
    marquerMessageLu: (async (_c: number, id: number) => id === 3) as never,
  }));
  const serveurEspace = espace.listen(0, "127.0.0.1");
  await new Promise<void>((pret) => serveurEspace.once("listening", () => pret()));
  const base = `http://127.0.0.1:${(serveurEspace.address() as AddressInfo).port}/espace-ambassadeur`;
  try {
    assert.deepEqual(await (await fetch(`${base}/missions`)).json(), { ok: true, missions: [{ id: 1, titre: "Vérifier" }] });
    const envoyer = (chemin: string, corps: unknown) => fetch(`${base}${chemin}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
    assert.equal((await envoyer("/missions/1/compte-rendu", { compteRendu: "ok" })).status, 400);
    assert.equal((await envoyer("/missions/1/compte-rendu", { compteRendu: "Lieu bien réel, accueil adorable." })).status, 200);
    assert.deepEqual(faits[0], { compteId: 7, id: 1, texte: "Lieu bien réel, accueil adorable." });
    assert.equal((await envoyer("/messages/3/lu", {})).status, 200);
    assert.equal((await envoyer("/messages/4/lu", {})).status, 404);
  } finally {
    await new Promise<void>((fini) => serveurEspace.close(() => fini()));
  }
});
