import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import { declencher, lireMinuteriesEnAttente, oublierMinuteries, pause } from "../synchro-profil/banc/minuteries.mjs";
import { creerRenvoiChoixOffres } from "~/services/renvoi-choix-offres";

const CLE = "sosmiam.choix-offres-a-renvoyer";

const lireRepere = () => {
  const brut = globalThis.__magasin.get(CLE);
  return brut === undefined ? null : JSON.parse(brut).offres;
};

function creerServeur(issues = []) {
  const envois = [];
  const reperesAuDepart = [];
  const envoyer = async (offres) => {
    envois.push(offres);
    reperesAuDepart.push(lireRepere());
    const issue = issues.length > 0 ? issues.shift() : "parti";
    if (issue instanceof Error) throw issue;
    return issue;
  };
  return { envois, reperesAuDepart, envoyer, issues };
}

function creerServeurLent() {
  const envois = [];
  const enCours = [];
  const envoyer = (offres) => {
    envois.push(offres);
    return new Promise((repondre) => enCours.push(repondre));
  };
  const repondre = async (issue) => {
    while (enCours.length === 0) await pause(1);
    enCours.shift()(issue);
    await pause(5);
  };
  return { envois, envoyer, repondre };
}

function compterAnnonces(renvoi) {
  const vues = [];
  renvoi.abonner(() => vues.push(renvoi.lireEnAttente()));
  return vues;
}

beforeEach(() => {
  globalThis.__magasin = new Map();
  globalThis.__delaiMagasin = 0;
  oublierMinuteries();
});

test("échec : le repère reste sur le téléphone et l'écran l'apprend", async () => {
  const renvoi = creerRenvoiChoixOffres();
  const vues = compterAnnonces(renvoi);
  const serveur = creerServeur(["a-renvoyer"]);
  await renvoi.choisir(false, serveur.envoyer);
  assert.deepEqual(serveur.envois, [false]);
  assert.equal(lireRepere(), false);
  assert.equal(renvoi.lireEnAttente(), true);
  assert.deepEqual(vues, [true]);
});

test("le repère est écrit avant l'envoi : une app coupée en route renverra quand même", async () => {
  const renvoi = creerRenvoiChoixOffres();
  const serveur = creerServeur(["parti"]);
  await renvoi.choisir(false, serveur.envoyer);
  assert.deepEqual(serveur.reperesAuDepart, [false]);
});

test("retour au premier plan : le choix repart, et l'envoi qui passe efface le repère", async () => {
  const renvoi = creerRenvoiChoixOffres();
  const vues = compterAnnonces(renvoi);
  const serveur = creerServeur(["a-renvoyer", "parti"]);
  await renvoi.choisir(false, serveur.envoyer);
  await renvoi.renvoyer(serveur.envoyer);
  assert.deepEqual(serveur.envois, [false, false]);
  assert.equal(lireRepere(), null);
  assert.equal(renvoi.lireEnAttente(), false);
  assert.deepEqual(vues, [true, false]);
});

test("succès du premier coup : aucun repère, aucun mot à l'écran", async () => {
  const renvoi = creerRenvoiChoixOffres();
  const vues = compterAnnonces(renvoi);
  const serveur = creerServeur(["parti"]);
  await renvoi.choisir(true, serveur.envoyer);
  assert.equal(lireRepere(), null);
  assert.deepEqual(vues, []);
  assert.deepEqual(lireMinuteriesEnAttente(), []);
});

test("un nouveau choix remplace l'ancien repère : le dernier gagne", async () => {
  const renvoi = creerRenvoiChoixOffres();
  const serveur = creerServeur(["a-renvoyer", "a-renvoyer", "parti"]);
  await renvoi.choisir(true, serveur.envoyer);
  assert.equal(lireRepere(), true);
  await renvoi.choisir(false, serveur.envoyer);
  assert.equal(lireRepere(), false);
  await renvoi.renvoyer(serveur.envoyer);
  assert.deepEqual(serveur.envois, [true, false, false]);
  assert.equal(lireRepere(), null);
});

test("choix pendant un envoi lent : le succès de l'ancien n'efface pas le nouveau, qui part ensuite", async () => {
  const renvoi = creerRenvoiChoixOffres();
  const serveur = creerServeurLent();
  const premier = renvoi.choisir(true, serveur.envoyer);
  await pause(5);
  const deuxieme = renvoi.choisir(false, serveur.envoyer);
  const troisieme = renvoi.choisir(true, serveur.envoyer);
  const quatrieme = renvoi.choisir(false, serveur.envoyer);
  await pause(5);
  assert.equal(lireRepere(), false);
  await serveur.repondre("parti");
  assert.equal(lireRepere(), false);
  await serveur.repondre("parti");
  await Promise.all([premier, deuxieme, troisieme, quatrieme]);
  assert.deepEqual(serveur.envois, [true, false]);
  assert.equal(lireRepere(), null);
});

test("choix pendant un envoi lent qui échoue ensuite : le repère garde le dernier choix", async () => {
  const renvoi = creerRenvoiChoixOffres();
  const serveur = creerServeurLent();
  const premier = renvoi.choisir(false, serveur.envoyer);
  await pause(5);
  const deuxieme = renvoi.choisir(true, serveur.envoyer);
  const troisieme = renvoi.choisir(false, serveur.envoyer);
  await serveur.repondre("parti");
  await serveur.repondre("a-renvoyer");
  await Promise.all([premier, deuxieme, troisieme]);
  assert.deepEqual(serveur.envois, [false, false]);
  assert.equal(lireRepere(), false);
  assert.equal(renvoi.lireEnAttente(), true);
});

test("au lancement : le repère gardé est relu, montré, puis renvoyé", async () => {
  globalThis.__magasin.set(CLE, JSON.stringify({ offres: false }));
  const renvoi = creerRenvoiChoixOffres();
  assert.equal(renvoi.lireEnAttente(), false);
  const vuPendantEnvoi = [];
  const envoyer = async (offres) => {
    vuPendantEnvoi.push([offres, renvoi.lireEnAttente()]);
    return "parti";
  };
  await renvoi.renvoyer(envoyer);
  assert.deepEqual(vuPendantEnvoi, [[false, true]]);
  assert.equal(lireRepere(), null);
  assert.equal(renvoi.lireEnAttente(), false);
});

test("un choix fait avant la relecture du repère gagne sur l'ancien", async () => {
  globalThis.__magasin.set(CLE, JSON.stringify({ offres: true }));
  const renvoi = creerRenvoiChoixOffres();
  const serveur = creerServeur(["parti"]);
  await renvoi.choisir(false, serveur.envoyer);
  assert.deepEqual(serveur.envois, [false]);
  assert.equal(lireRepere(), null);
});

test("sans repère, un retour au premier plan n'envoie rien", async () => {
  const renvoi = creerRenvoiChoixOffres();
  const serveur = creerServeur();
  await renvoi.renvoyer(serveur.envoyer);
  await renvoi.renvoyer(serveur.envoyer);
  assert.deepEqual(serveur.envois, []);
});

test("sans suite (pas de jeton, notifications coupées, refus définitif) : le repère s'efface, sans nouvel essai", async () => {
  const renvoi = creerRenvoiChoixOffres();
  const serveur = creerServeur(["a-renvoyer", "sans-suite"]);
  await renvoi.choisir(true, serveur.envoyer);
  await renvoi.renvoyer(serveur.envoyer);
  assert.equal(lireRepere(), null);
  assert.equal(renvoi.lireEnAttente(), false);
  assert.deepEqual(lireMinuteriesEnAttente(), []);
});

test("un envoi qui lève une erreur compte comme un échec", async () => {
  const renvoi = creerRenvoiChoixOffres();
  const serveur = creerServeur([new Error("réseau en vrac")]);
  await renvoi.choisir(false, serveur.envoyer);
  assert.equal(lireRepere(), false);
  assert.equal(renvoi.lireEnAttente(), true);
});

test("app ouverte : nouvel essai dans 30 s, puis 2 min, puis toutes les 10 min, jusqu'au succès", async () => {
  const renvoi = creerRenvoiChoixOffres();
  const serveur = creerServeur(["a-renvoyer", "a-renvoyer", "a-renvoyer", "a-renvoyer", "parti"]);
  await renvoi.choisir(false, serveur.envoyer);
  assert.deepEqual(lireMinuteriesEnAttente(), [30_000]);
  await declencher();
  assert.deepEqual(lireMinuteriesEnAttente(), [120_000]);
  await declencher();
  assert.deepEqual(lireMinuteriesEnAttente(), [600_000]);
  await declencher();
  assert.deepEqual(lireMinuteriesEnAttente(), [600_000]);
  await declencher();
  assert.deepEqual(serveur.envois, [false, false, false, false, false]);
  assert.deepEqual(lireMinuteriesEnAttente(), []);
  assert.equal(lireRepere(), null);
});

test("un retour au premier plan annule la minuterie en cours et repart tout de suite", async () => {
  const renvoi = creerRenvoiChoixOffres();
  const serveur = creerServeur(["a-renvoyer", "parti"]);
  await renvoi.choisir(true, serveur.envoyer);
  assert.deepEqual(lireMinuteriesEnAttente(), [30_000]);
  await renvoi.renvoyer(serveur.envoyer);
  assert.deepEqual(lireMinuteriesEnAttente(), []);
  assert.deepEqual(serveur.envois, [true, true]);
  assert.equal(lireRepere(), null);
});

test("deux retours au premier plan rapprochés ne font qu'un envoi", async () => {
  globalThis.__magasin.set(CLE, JSON.stringify({ offres: false }));
  const renvoi = creerRenvoiChoixOffres();
  const serveur = creerServeur(["parti"]);
  await Promise.all([renvoi.renvoyer(serveur.envoyer), renvoi.renvoyer(serveur.envoyer)]);
  assert.deepEqual(serveur.envois, [false]);
});

test("un repère illisible est ignoré", async () => {
  globalThis.__magasin.set(CLE, "{pas du json");
  const renvoi = creerRenvoiChoixOffres();
  const serveur = creerServeur();
  await renvoi.renvoyer(serveur.envoyer);
  assert.deepEqual(serveur.envois, []);
});

function creerHasard(graine) {
  let etat = graine;
  return () => {
    etat = (etat * 1_103_515_245 + 12_345) % 2_147_483_648;
    return etat / 2_147_483_648;
  };
}

test("au hasard (stockage lent, réponses lentes, échecs) : au calme, le serveur ou le repère a toujours le dernier choix", async () => {
  globalThis.__delaiMagasin = 2;
  for (let graine = 1; graine <= 12; graine += 1) {
    globalThis.__magasin = new Map();
    oublierMinuteries();
    const hasard = creerHasard(graine);
    const renvoi = creerRenvoiChoixOffres();
    let serveur = null;
    const envoyer = async (offres) => {
      await pause(Math.floor(hasard() * 6));
      const tirage = hasard();
      if (tirage < 0.4) {
        serveur = offres;
        return "parti";
      }
      if (tirage < 0.5) throw new Error("coupure");
      return "a-renvoyer";
    };
    const gestes = [];
    let dernier = null;
    for (let i = 0; i < 8; i += 1) {
      if (hasard() < 0.75) {
        dernier = hasard() < 0.5;
        gestes.push(renvoi.choisir(dernier, envoyer));
      } else {
        gestes.push(renvoi.renvoyer(envoyer));
      }
      await pause(Math.floor(hasard() * 4));
    }
    await Promise.all(gestes);
    await pause(10);
    const repere = lireRepere();
    if (repere === null) assert.equal(serveur, dernier, `graine ${graine} : le serveur a ${serveur}, le dernier choix est ${dernier}`);
    else assert.equal(repere, dernier, `graine ${graine} : le repère garde ${repere}, le dernier choix est ${dernier}`);
    assert.equal(renvoi.lireEnAttente(), repere !== null, `graine ${graine} : l'écran ne dit pas la même chose que le repère`);
    await renvoi.renvoyer(async (offres) => {
      serveur = offres;
      return "parti";
    });
    assert.equal(serveur, dernier, `graine ${graine} : après le retour du réseau`);
    assert.equal(lireRepere(), null);
  }
});
