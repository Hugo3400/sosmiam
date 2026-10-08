// Tests de « Mon compte » et de l'espace d'un ambassadeur validé : candidature fondateur, propositions de lieux, missions
// et messages (routes /espace-ambassadeur), statuts. Services en mémoire : aucune base de données n'est touchée.
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import { calculerEmpreinteJeton } from "../src/fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../src/fonctions/securite/creer-jeton.ts";
import { hacherMotDePasse } from "../src/fonctions/securite/hacher-mot-de-passe.ts";
import type { DependancesEspaceAmbassadeur } from "../src/routes/espace-ambassadeur.ts";
import { creerComptesEnMemoire } from "../src/services/comptes-en-memoire.ts";
import type { CandidatureVue, PropositionVue } from "../src/services/comptes-espace.ts";
import type { CompteConnecte, StatutAmbassadeur } from "../src/services/comptes.ts";

const MOT_DE_PASSE = "une petite phrase de passe";
let horloge = Date.parse("2026-10-08T10:00:00Z");
const memoire = creerComptesEnMemoire(() => horloge);
/** Faux services des missions et messages (session « Logiciel ») : on note avec quel compte ils sont appelés */
const appelsEspace: unknown[] = [];
const espaceAmbassadeur = {
  missionsDuCompte: async (compteId: number) => (appelsEspace.push({ missions: compteId }), [{ id: 1, titre: "Vérifier les horaires" }]),
  terminerMission: async (compteId: number, id: number, compteRendu: string) => (appelsEspace.push({ compteId, id, longueur: compteRendu.length }), id === 1),
  messagesDuCompte: async () => [],
  marquerMessageLu: async (_compteId: number, id: number) => id === 3,
} as unknown as DependancesEspaceAmbassadeur;
const serveur = creerApplication({
  enregistrerInscription: async () => {},
  comptes: { services: memoire.services, sessions: memoire.sessions, horloge: () => horloge },
  espaceAmbassadeur,
}).listen(0, "127.0.0.1");
let adresse = "";
before(() => new Promise<void>((pret) => serveur.once("listening", () => {
  adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  pret();
})));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));

type Corps = {
  ok: boolean; erreur?: string; champ?: string; attente?: number; session?: string; compte?: CompteConnecte;
  candidature?: CandidatureVue | null; propositions?: PropositionVue[];
};
type Options = { corps?: unknown; jeton?: string };
let visiteur = 0;
async function demander(methode: string, chemin: string, { corps, jeton }: Options = {}) {
  const reponse = await fetch(`${adresse}${chemin}`, {
    method: methode,
    headers: {
      "X-IP-Visiteur": `visiteur-${++visiteur}`,
      ...(corps === undefined ? {} : { "Content-Type": "application/json" }),
      ...(jeton ? { "X-Session-Compte": jeton } : {}),
    },
    ...(corps === undefined ? {} : { body: JSON.stringify(corps) }),
  });
  return { statut: reponse.status, corps: (await reponse.json()) as Corps, entetes: reponse.headers };
}

const empreinte = await hacherMotDePasse(MOT_DE_PASSE);
let numero = 0;
async function ouvrirSession(compteId: number) {
  const jeton = creerJeton();
  await memoire.sessions.creer(calculerEmpreinteJeton(jeton), { compteId, creeLe: horloge, activite: horloge });
  return jeton;
}
/** Un compte déjà là (sans passer par l'inscription, pour aller vite) et une session ouverte pour lui. */
async function creerCompteEtSession(statut: StatutAmbassadeur = "actif") {
  const email = `espace${++numero}@exemple.fr`;
  const id = await memoire.services.creerCompte({ email, motDePasse: empreinte, prenom: "Camille", ville: "Lyon", quartier: null, cguVersion: "2026-10-08" });
  if (id === null) throw new Error("compte de test impossible");
  if (statut !== "en-attente") await memoire.decider(id, statut);
  return { id, email, jeton: await ouvrirSession(id) };
}

const CANDIDATURE = {
  pepites: "La Fournée (pain au levain), Chez Mamie Rose (gratin), Le Petit Four (choux).", envies: ["denicher", "faire-savoir"],
  reseaux: "@zoe.miam", motivation: "Je connais tous les boulangers du quartier.", partantRencontre: true, connuPar: "Instagram",
};
const PROPOSITION = {
  nom: " Le Petit Four ", type: "patisserie", ville: "Nantes", description: "Des choux garnis à la minute, une équipe adorable.",
  instagram: "@lepetitfour", siteWeb: "https://lepetitfour.fr",
};

test("« Mon compte » : prénom, ville et quartier changent (quartier vide : effacé) ; un champ invalide est refusé", async () => {
  const { jeton } = await creerCompteEtSession("en-attente");
  const modifier = (corps: unknown) => demander("PATCH", "/comptes/moi", { corps, jeton });
  const { statut, corps } = await modifier({ prenom: "  Zoé  ", ville: "Brest", quartier: "Recouvrance" });
  assert.equal(statut, 200);
  assert.deepEqual([corps.compte?.prenom, corps.compte?.ambassadeur?.ville, corps.compte?.ambassadeur?.quartier], ["Zoé", "Brest", "Recouvrance"]);
  const efface = await modifier({ quartier: "" });
  assert.deepEqual([efface.corps.compte?.prenom, efface.corps.compte?.ambassadeur?.quartier], ["Zoé", null]);
  for (const [champ, valeur] of [["prenom", ""], ["ville", "B"], ["quartier", "x".repeat(81)]] as const) {
    assert.deepEqual((await modifier({ [champ]: valeur })).corps, { ok: false, erreur: "champ-invalide", champ });
  }
  assert.equal((await demander("PATCH", "/comptes/moi", { corps: { prenom: "Zoé" } })).statut, 401);
});

test("changer de mot de passe : l'actuel et le nouveau sont vérifiés ; les autres sessions sont fermées", async () => {
  const { id, email, jeton } = await creerCompteEtSession();
  const autre = await ouvrirSession(id);
  const changer = (corps: unknown) => demander("POST", "/comptes/moi/mot-de-passe", { corps, jeton });
  assert.deepEqual((await changer({ actuel: MOT_DE_PASSE, nouveau: "court" })).corps, { ok: false, erreur: "champ-invalide", champ: "nouveau" });
  assert.equal((await changer({ actuel: MOT_DE_PASSE, nouveau: email })).corps.champ, "nouveau");
  const faux = await changer({ actuel: "pas le bon mot de passe", nouveau: "un nouveau mot de passe" });
  assert.equal(faux.statut, 403);
  assert.deepEqual(faux.corps, { ok: false, erreur: "mot-de-passe-incorrect" });
  assert.deepEqual((await changer({ actuel: MOT_DE_PASSE, nouveau: "un nouveau mot de passe" })).corps, { ok: true });
  assert.equal((await demander("GET", "/comptes/session", { jeton })).statut, 200, "la session en cours reste ouverte");
  assert.equal((await demander("GET", "/comptes/session", { jeton: autre })).statut, 401, "les autres sont fermées");
  assert.equal((await demander("POST", "/comptes/session", { corps: { email, motDePasse: "un nouveau mot de passe" } })).statut, 201);
});

test("effacer son compte : mot de passe demandé, puis tout disparaît (ses propositions restent, sans lui)", async () => {
  const { id, email, jeton } = await creerCompteEtSession();
  await memoire.services.creerCandidature(id, CANDIDATURE);
  await memoire.services.creerProposition(id, { ...PROPOSITION, adresse: null, plat: null, horaires: null });
  const effacer = (motDePasse: string) => demander("DELETE", "/comptes/moi", { corps: { motDePasse }, jeton });
  assert.equal((await effacer("pas le bon mot de passe")).statut, 403);
  assert.equal(memoire.comptes.has(id), true);
  assert.deepEqual((await effacer(MOT_DE_PASSE)).corps, { ok: true });
  assert.equal(memoire.comptes.has(id), false);
  assert.equal(memoire.candidatures.some((candidature) => candidature.compteId === id), false);
  assert.ok(memoire.propositions.some((proposition) => proposition.nom === PROPOSITION.nom && proposition.compteId === null));
  assert.equal((await demander("GET", "/comptes/session", { jeton })).statut, 401);
  assert.equal((await demander("POST", "/comptes/session", { corps: { email, motDePasse: MOT_DE_PASSE } })).statut, 401);
});

test("l'attente vaut aussi pour un e-mail inconnu (sinon elle trahirait qui est inscrit) et pour « Mon compte »", async () => {
  const connecter = (email: string) => demander("POST", "/comptes/session", { corps: { email, motDePasse: "pas le bon mot de passe" } });
  for (let i = 0; i < 5; i++) assert.equal((await connecter("inconnu@exemple.fr")).statut, 401);
  assert.deepEqual((await connecter("inconnu@exemple.fr")).corps, { ok: false, erreur: "trop-de-demandes", attente: 1 });
  // Les erreurs dans « Mon compte » comptent avec celles de la connexion
  const { email, jeton } = await creerCompteEtSession();
  for (let i = 0; i < 4; i++) assert.equal((await connecter(email)).statut, 401);
  assert.equal((await demander("DELETE", "/comptes/moi", { corps: { motDePasse: "pas le bon" }, jeton })).statut, 403);
  assert.equal((await connecter(email)).statut, 429);
  assert.equal((await demander("DELETE", "/comptes/moi", { corps: { motDePasse: MOT_DE_PASSE }, jeton })).statut, 429);
});

test("candidature fondateur : réservée aux actifs, une seule à la fois ; après un refus, on peut recandidater", async () => {
  const enAttente = await creerCompteEtSession("en-attente");
  for (const [methode, chemin] of [["GET", "candidature"], ["POST", "candidature"], ["GET", "propositions"], ["POST", "propositions"]] as const) {
    const reponse = await demander(methode, `/comptes/moi/${chemin}`, { jeton: enAttente.jeton, corps: methode === "POST" ? CANDIDATURE : undefined });
    assert.equal(reponse.statut, 403);
    assert.deepEqual(reponse.corps, { ok: false, erreur: "ambassadeur-non-actif" });
  }
  const { id, jeton } = await creerCompteEtSession();
  const candidater = (corps: unknown) => demander("POST", "/comptes/moi/candidature", { corps, jeton });
  const lire = async () => (await demander("GET", "/comptes/moi/candidature", { jeton })).corps;
  assert.deepEqual(await lire(), { ok: true, candidature: null });
  const cas: [string, Record<string, unknown>][] = [
    ["pepites", { pepites: "trop court" }], ["envies", { envies: [] }], ["envies", { envies: ["voler"] }], ["envies", { envies: "denicher" }],
    ["reseaux", { reseaux: "x".repeat(201) }], ["motivation", { motivation: "court" }], ["partantRencontre", { partantRencontre: "oui" }],
    ["connuPar", { connuPar: "x".repeat(121) }],
  ];
  for (const [champ, modification] of cas) {
    assert.deepEqual((await candidater({ ...CANDIDATURE, ...modification })).corps, { ok: false, erreur: "champ-invalide", champ }, champ);
  }
  assert.equal((await candidater({ ...CANDIDATURE, piege: "robot" })).statut, 201);
  assert.equal(memoire.candidatures.filter((candidature) => candidature.compteId === id).length, 0, "un robot ne laisse rien");
  assert.equal((await candidater(CANDIDATURE)).statut, 201);
  assert.deepEqual(memoire.candidatures.at(-1)?.envies, ["denicher", "faire-savoir"]);
  assert.deepEqual(await lire(), { ok: true, candidature: { statut: "en-attente", numero: null, creeLe: new Date(horloge).toISOString(), reponduLe: null } });
  assert.deepEqual((await candidater(CANDIDATURE)).corps, { ok: false, erreur: "candidature-existante" });
  memoire.repondreCandidature(id, "refusee");
  assert.equal((await candidater(CANDIDATURE)).statut, 201);
  memoire.repondreCandidature(id, "acceptee", 4);
  assert.equal((await lire()).candidature?.numero, 4);
  assert.equal((await candidater(CANDIDATURE)).statut, 409);
});

test("propositions de lieux : mêmes règles que « J'inscris mon lieu », sans contact ; la liste montre leur statut", async () => {
  const { id, jeton } = await creerCompteEtSession();
  const proposer = (corps: unknown) => demander("POST", "/comptes/moi/propositions", { corps, jeton });
  for (const [champ, valeur] of [["nom", ""], ["ville", " "], ["description", "trop court"], ["siteWeb", "javascript:alert(1)"], ["adresse", "x".repeat(161)]] as const) {
    assert.deepEqual((await proposer({ ...PROPOSITION, [champ]: valeur })).corps, { ok: false, erreur: "champ-invalide", champ }, champ);
  }
  assert.equal((await proposer(PROPOSITION)).statut, 201);
  const gardee = memoire.propositions.at(-1);
  assert.deepEqual(gardee, {
    nom: "Le Petit Four", type: "patisserie", ville: "Nantes", adresse: null, description: PROPOSITION.description, plat: null, horaires: null,
    siteWeb: "https://lepetitfour.fr", instagram: "lepetitfour", id: gardee?.id, compteId: id, statut: "a-traiter", creeLe: horloge,
  });
  assert.equal((await proposer({ ...PROPOSITION, nom: "La Fusée", type: "fusee", contactEmail: "lieu@exemple.fr" })).statut, 201);
  assert.equal(memoire.propositions.at(-1)?.type, null);
  assert.ok(!("contactEmail" in (memoire.propositions.at(-1) ?? {})));
  const { corps } = await demander("GET", "/comptes/moi/propositions", { jeton });
  assert.deepEqual(corps.propositions?.map(({ nom, ville, statut }) => [nom, ville, statut]), [["La Fusée", "Nantes", "a-traiter"], ["Le Petit Four", "Nantes", "a-traiter"]]);
});

test("refusé ou suspendu : il se connecte et voit son statut, rien d'autre ; une décision de l'équipe compte tout de suite", async () => {
  const refuse = await creerCompteEtSession("refuse");
  const session = await demander("GET", "/comptes/session", { jeton: refuse.jeton });
  assert.deepEqual(session.corps.compte?.ambassadeur, { statut: "refuse", ville: "Lyon", quartier: null, decideLe: new Date(horloge).toISOString() });
  assert.equal((await demander("GET", "/comptes/moi/propositions", { jeton: refuse.jeton })).statut, 403);
  assert.equal((await demander("PATCH", "/comptes/moi", { corps: { prenom: "Noa" }, jeton: refuse.jeton })).statut, 200);
  const actif = await creerCompteEtSession();
  assert.equal((await demander("GET", "/comptes/moi/propositions", { jeton: actif.jeton })).statut, 200);
  await memoire.decider(actif.id, "suspendu");
  assert.equal((await demander("GET", "/comptes/moi/propositions", { jeton: actif.jeton })).statut, 401, "déconnecté aussitôt");
  const reconnecte = await ouvrirSession(actif.id);
  assert.equal((await demander("GET", "/comptes/moi/propositions", { jeton: reconnecte })).statut, 403);
});

test("missions et messages : seulement pour un ambassadeur actif, jamais en cache ; un long compte rendu accentué passe", async () => {
  assert.equal((await demander("GET", "/espace-ambassadeur/missions")).statut, 401);
  const enAttente = await creerCompteEtSession("en-attente");
  assert.deepEqual((await demander("GET", "/espace-ambassadeur/missions", { jeton: enAttente.jeton })).corps, { ok: false, erreur: "ambassadeur-non-actif" });
  const { id, jeton } = await creerCompteEtSession();
  const missions = await demander("GET", "/espace-ambassadeur/missions", { jeton });
  assert.equal(missions.statut, 200);
  assert.equal(missions.entetes.get("cache-control"), "private, no-store");
  assert.deepEqual(appelsEspace.at(-1), { missions: id });
  // 2 000 « é » : plus de 4 Ko de JSON, accepté quand même
  assert.equal((await demander("POST", "/espace-ambassadeur/missions/1/compte-rendu", { corps: { compteRendu: "é".repeat(2000) }, jeton })).statut, 200);
  assert.deepEqual(appelsEspace.at(-1), { compteId: id, id: 1, longueur: 2000 });
  assert.equal((await demander("POST", "/espace-ambassadeur/messages/3/lu", { corps: {}, jeton })).statut, 200);
  assert.equal((await demander("POST", "/espace-ambassadeur/messages/4/lu", { corps: {}, jeton })).statut, 404);
});
