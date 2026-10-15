// Les courses du profil (une réponse en vol pendant qu'on coche ses envies), le rattrapage d'un téléphone d'avant la
// synchro, le compte limité, la ville inconnue du serveur, et les pseudos changés par l'équipe. Sans avatar posé : seul le
// profil voyage.
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { LOCAL, VU, decisionRetenue, etat, lireEtatGarde } from "./banc/donnees.mjs";
import { declencher, lireMinuteriesEnAttente, pause } from "./banc/minuteries.mjs";
import { demarrer, remettreDoublures } from "./banc/serveur.mjs";

beforeEach(remettreDoublures);

/** Le moteur monté sans avatar (rien ne part pour lui), sa première lecture faite */
const demarrerSansAvatar = (o = {}) => demarrer({ avatar: null, attente: 30, ...o });

test("A. relecture en vol, envies cochées pendant le voyage : elles gagnent, puis partent", async () => {
  const { moteur, s } = await demarrerSansAvatar({ magasin: etat() });
  s.demandes.length = 0;
  let lacher;
  s.retard = new Promise((r) => (lacher = r));
  s.serveur.envies = { lieux: ["restos"] }; // changé ailleurs
  moteur.auPremierPlan();
  moteur.activer(false);
  moteur.activer(true);
  await pause(5);
  await moteur.modifierEnvies({ lieux: ["bars-a-vin"], regimes: ["halal"] });
  lacher();
  s.retard = null;
  await pause(50);
  assert.deepEqual(s.demandes, ["GET", 'PATCH {"envies":{"lieux":["bars-a-vin"]}}']);
  assert.deepEqual(s.profil.envies, { lieux: ["bars-a-vin"], regimes: ["halal"] }, "téléphone");
  assert.deepEqual(s.serveur.envies, { lieux: ["bars-a-vin"] }, "serveur (sans les régimes)");
});

test("B. Mes infos en vol, envies cochées pendant le voyage : la ville part, puis les envies", async () => {
  const { moteur, s } = await demarrerSansAvatar({ magasin: etat() });
  s.demandes.length = 0;
  let lacher;
  s.retard = new Promise((r) => (lacher = r));
  const p = moteur.modifierInfos({ ville: "Lyon" });
  await pause(5);
  await moteur.modifierEnvies({ lieux: ["bars-a-vin"], regimes: ["halal"] });
  lacher();
  s.retard = null;
  const r = await p;
  await pause(50);
  assert.deepEqual(r, { ok: true, parti: true });
  assert.deepEqual(s.demandes, ['PATCH {"ville":"Lyon"}', 'PATCH {"envies":{"lieux":["bars-a-vin"]}}']);
  assert.equal(s.profil.ville, "Lyon");
  assert.deepEqual(s.profil.envies, { lieux: ["bars-a-vin"], regimes: ["halal"] }, "téléphone");
  assert.equal(s.serveur.ville, "Lyon");
  assert.deepEqual(s.serveur.envies, { lieux: ["bars-a-vin"] }, "serveur (sans les régimes)");
});

test("C. hors ligne : ville et nom (Mes infos), puis envies ; au retour du réseau, tout part ensemble, sans les régimes", async () => {
  const { moteur, s } = await demarrerSansAvatar({ magasin: etat() });
  s.horsLigne = true;
  s.demandes.length = 0;
  const r = await moteur.modifierInfos({ ville: "Nantes", nom: "Dupont" });
  await pause(20);
  await moteur.modifierEnvies({ lieux: ["cafes", "restos"], regimes: ["halal", "vegan"] });
  await pause(20);
  s.horsLigne = false;
  await declencher(30);
  await pause(30);
  assert.deepEqual(r, { ok: true, parti: false, attente: "reseau" });
  assert.deepEqual(s.demandes.slice(-1), ['PATCH {"nom":"Dupont","ville":"Nantes","envies":{"lieux":["cafes","restos"]}}']);
  assert.ok(!s.demandes.some((d) => d.includes("regimes")), "les régimes ne partent jamais");
  assert.deepEqual(lireEtatGarde().aEnvoyer, [], "plus rien n'attend");
  assert.equal(s.profil.ville, "Nantes");
  assert.equal(s.profil.nom, "Dupont");
  assert.deepEqual(s.profil.envies, { lieux: ["cafes", "restos"], regimes: ["halal", "vegan"] });
});

test("D. pseudo neutre de la modération : annoncé une fois, puis plus jamais (même après relance) ; l'ancien pseudo se retape", async () => {
  const { moteur, s } = await demarrerSansAvatar({ magasin: etat() });
  s.serveur.pseudo = "miami4821";
  s.decisions = [decisionRetenue()];
  moteur.activer(false);
  moteur.activer(true);
  await pause(40);
  const a1 = s.vues.at(-1);
  moteur.activer(false);
  moteur.activer(true);
  await pause(40);
  const a2 = s.vues.at(-1);
  moteur.fermerAnnonce();
  await pause(5);
  moteur.activer(false);
  moteur.activer(true);
  await pause(40);
  const annonce = { annonce: { type: "pseudo-neutre", pseudo: "miami4821" }, pseudoMisDeCote: "bob" };
  assert.deepEqual(a1, annonce, "annoncé");
  assert.deepEqual(a2, annonce, "toujours là après une relance, sans doublon");
  assert.deepEqual(s.vues.at(-1), { annonce: null, pseudoMisDeCote: "bob" }, "après « Compris » et une relance : plus d'annonce");
  assert.equal(s.profil.pseudo, "miami4821");
  // Ce serveur-là ne réserve pas bob : il le reprend ; ensuite, bob est déjà le sien (un pseudo inchangé n'est jamais « pris »)
  assert.deepEqual(await moteur.modifierInfos({ pseudo: "bob" }), { ok: true, parti: true });
  s.pris.add("bob");
  assert.deepEqual(await moteur.modifierInfos({ pseudo: "bob" }), { ok: true, parti: true });
});

/** E : un téléphone d'avant la synchro, changé ici (prénom, pseudo, nom, ville, envies), jamais parti */
async function rattraperTelephoneDAvant() {
  const local = { ...LOCAL, prenom: "Hugues", pseudo: "bobby", nom: "Dupont", ville: "Sète", envies: { lieux: ["restos"], regimes: ["halal"] } };
  const t = await demarrerSansAvatar({ local, magasin: [] });
  await pause(50);
  return t;
}

test("E. rattrapage d'un téléphone d'avant la synchro : ce qui n'est jamais parti part, le pseudo du serveur reste", async () => {
  const { s } = await rattraperTelephoneDAvant();
  assert.deepEqual(s.demandes, ["GET", 'PATCH {"prenom":"Hugues","nom":"Dupont","ville":"Sète","envies":{"lieux":["restos"]}}']);
  assert.equal(s.profil.prenom, "Hugues");
  assert.equal(s.profil.pseudo, "bob");
  assert.equal(s.profil.ville, "Sète");
  assert.deepEqual(s.profil.envies, { lieux: ["restos"], regimes: ["halal"] });
});

test(
  "E. rattrapage : l'annonce « pseudo du serveur » reste à l'écran (le changement de pseudo fait ici n'était jamais parti)",
  async () => {
    const { s } = await rattraperTelephoneDAvant();
    assert.deepEqual(s.vues.at(-1)?.annonce, { type: "pseudo-du-serveur", pseudo: "bob" });
  },
);

test("F. compte limité, prénom changé hors ligne puis renvoyé : la ville part, le prénom reste celui du compte, annoncé", async () => {
  const { moteur, s } = await demarrerSansAvatar({ magasin: etat() });
  s.horsLigne = true;
  await moteur.modifierInfos({ prenom: "Hugues", ville: "Lyon" });
  await pause(20);
  s.horsLigne = false;
  s.limite = true;
  s.demandes.length = 0;
  await declencher(30);
  await pause(60);
  assert.deepEqual(s.demandes, ['PATCH {"prenom":"Hugues","ville":"Lyon"}', 'PATCH {"ville":"Lyon"}']);
  assert.deepEqual(s.vues.at(-1)?.annonce, { type: "prenom-limite", jusqua: null });
  assert.equal(s.profil.prenom, "Hugo");
  assert.equal(s.profil.ville, "Lyon");
  assert.deepEqual(lireMinuteriesEnAttente(), [], "pas de nouvel essai en boucle");
});

test("G. ville inconnue du serveur (compte du site) : celle du téléphone repart une fois, pas de boucle", async () => {
  const { s } = await demarrerSansAvatar({ magasin: etat(), serveur: { ...VU, ville: null } });
  await pause(50);
  assert.deepEqual(s.demandes, ["GET", 'PATCH {"ville":"Montpellier"}']);
  assert.equal(s.serveur.ville, "Montpellier");
});

test("H. ancien pseudo mis de côté par l'équipe, retapé dans Mes infos : refusé comme tel ; un autre pseudo libre passe", async () => {
  const { moteur, s } = await demarrerSansAvatar({ magasin: etat() });
  s.serveur.pseudo = "miami4821";
  s.pris.add("bob");
  s.decisions = [decisionRetenue()];
  moteur.activer(false);
  moteur.activer(true);
  await pause(40);
  const r = await moteur.modifierInfos({ pseudo: "bob" });
  const r2 = await moteur.modifierInfos({ pseudo: "autre" });
  assert.deepEqual(r, { ok: false, refus: "pseudo-mis-de-cote" });
  assert.deepEqual(r2, { ok: true, parti: true });
  assert.deepEqual(s.vues.at(-1), { annonce: null, pseudoMisDeCote: "bob" });
});

test("I. Mes infos pendant une relecture lente : elle attend la fin de la relecture, puis part", async () => {
  const { moteur, s } = await demarrerSansAvatar({ magasin: etat() });
  s.demandes.length = 0;
  let lacher;
  s.retard = new Promise((r) => (lacher = r));
  s.horsLigne = true;
  moteur.activer(false);
  moteur.activer(true);
  await pause(5);
  const p = moteur.modifierInfos({ ville: "Lyon" });
  await pause(5);
  // Rien d'autre n'est parti pendant la relecture : Mes infos attend son tour dans le couloir
  assert.deepEqual(s.demandes, ["GET"], "Mes infos attend la fin de la relecture");
  // Le serveur du banc regarde le réseau au moment de répondre : revenu, la relecture finit bien
  s.horsLigne = false;
  lacher();
  s.retard = null;
  assert.deepEqual(await p, { ok: true, parti: true });
  assert.deepEqual(s.demandes, ["GET", 'PATCH {"ville":"Lyon"}']);
  assert.equal(s.profil.ville, "Lyon");
});
