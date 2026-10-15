import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import { declencher, lireMinuteriesEnAttente, oublierMinuteries, pause } from "../synchro-profil/banc/minuteries.mjs";
import { creerRenvoiChoixOffres } from "~/services/renvoi-choix-offres";

const CLE = "sosmiam.choix-offres-a-renvoyer";
const CHOIX = ["oui", "non", "couper"];

const lireRepere = () => {
  const brut = globalThis.__magasin.get(CLE);
  return brut === undefined ? null : JSON.parse(brut).choix;
};

function creerServeur(issues = []) {
  const envois = [];
  const reperesAuDepart = [];
  const envoyer = async (choix) => {
    envois.push(choix);
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
  const envoyer = (choix) => {
    envois.push(choix);
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
  await renvoi.choisir("non", serveur.envoyer);
  assert.deepEqual(serveur.envois, ["non"]);
  assert.equal(lireRepere(), "non");
  assert.equal(renvoi.lireEnAttente(), true);
  assert.deepEqual(vues, [true]);
});

test("le repère est écrit avant l'envoi, même sur un stockage lent : une app coupée en route renverra quand même", async () => {
  globalThis.__delaiMagasin = 15;
  const renvoi = creerRenvoiChoixOffres();
  const serveur = creerServeur(["parti"]);
  await renvoi.choisir("non", serveur.envoyer);
  assert.deepEqual(serveur.reperesAuDepart, ["non"]);
});

test("stockage lent : un « non » qui remplace un « oui » en attente est sur le disque avant de partir", async () => {
  globalThis.__delaiMagasin = 15;
  const renvoi = creerRenvoiChoixOffres();
  const serveur = creerServeur(["a-renvoyer", "parti"]);
  await renvoi.choisir("oui", serveur.envoyer);
  await renvoi.choisir("non", serveur.envoyer);
  assert.deepEqual(serveur.envois, ["oui", "non"]);
  assert.deepEqual(serveur.reperesAuDepart, ["oui", "non"]);
});

test("stockage lent : « couper » remplace un « oui » en attente avant de partir", async () => {
  globalThis.__delaiMagasin = 15;
  const renvoi = creerRenvoiChoixOffres();
  const serveur = creerServeur(["a-renvoyer", "parti"]);
  await renvoi.choisir("oui", serveur.envoyer);
  await renvoi.choisir("couper", serveur.envoyer);
  assert.deepEqual(serveur.reperesAuDepart, ["oui", "couper"]);
  assert.equal(lireRepere(), null);
});

test("retour au premier plan : le choix repart, et l'envoi qui passe efface le repère", async () => {
  const renvoi = creerRenvoiChoixOffres();
  const vues = compterAnnonces(renvoi);
  const serveur = creerServeur(["a-renvoyer", "parti"]);
  await renvoi.choisir("non", serveur.envoyer);
  await renvoi.renvoyer(serveur.envoyer);
  assert.deepEqual(serveur.envois, ["non", "non"]);
  assert.equal(lireRepere(), null);
  assert.equal(renvoi.lireEnAttente(), false);
  assert.deepEqual(vues, [true, false]);
});

test("succès du premier coup : aucun repère, aucun mot à l'écran", async () => {
  const renvoi = creerRenvoiChoixOffres();
  const vues = compterAnnonces(renvoi);
  const serveur = creerServeur(["parti"]);
  await renvoi.choisir("oui", serveur.envoyer);
  assert.equal(lireRepere(), null);
  assert.deepEqual(vues, []);
  assert.deepEqual(lireMinuteriesEnAttente(), []);
});

test("un nouveau choix remplace l'ancien repère : le dernier gagne", async () => {
  const renvoi = creerRenvoiChoixOffres();
  const serveur = creerServeur(["a-renvoyer", "a-renvoyer", "parti"]);
  await renvoi.choisir("oui", serveur.envoyer);
  assert.equal(lireRepere(), "oui");
  await renvoi.choisir("non", serveur.envoyer);
  assert.equal(lireRepere(), "non");
  await renvoi.renvoyer(serveur.envoyer);
  assert.deepEqual(serveur.envois, ["oui", "non", "non"]);
  assert.equal(lireRepere(), null);
});

test("choix pendant un envoi lent : le succès de l'ancien n'efface pas le nouveau, qui part ensuite", async () => {
  const renvoi = creerRenvoiChoixOffres();
  const serveur = creerServeurLent();
  const premier = renvoi.choisir("oui", serveur.envoyer);
  await pause(5);
  const deuxieme = renvoi.choisir("non", serveur.envoyer);
  const troisieme = renvoi.choisir("oui", serveur.envoyer);
  const quatrieme = renvoi.choisir("non", serveur.envoyer);
  await pause(5);
  assert.equal(lireRepere(), "non");
  await serveur.repondre("parti");
  assert.equal(lireRepere(), "non");
  await serveur.repondre("parti");
  await Promise.all([premier, deuxieme, troisieme, quatrieme]);
  assert.deepEqual(serveur.envois, ["oui", "non"]);
  assert.equal(lireRepere(), null);
});

test("choix pendant un envoi lent qui échoue ensuite : le repère garde le dernier choix", async () => {
  const renvoi = creerRenvoiChoixOffres();
  const serveur = creerServeurLent();
  const premier = renvoi.choisir("non", serveur.envoyer);
  await pause(5);
  const deuxieme = renvoi.choisir("oui", serveur.envoyer);
  const troisieme = renvoi.choisir("non", serveur.envoyer);
  await serveur.repondre("parti");
  await serveur.repondre("a-renvoyer");
  await Promise.all([premier, deuxieme, troisieme]);
  assert.deepEqual(serveur.envois, ["non", "non"]);
  assert.equal(lireRepere(), "non");
  assert.equal(renvoi.lireEnAttente(), true);
});

test("au lancement : le repère gardé est relu, montré, puis renvoyé", async () => {
  globalThis.__magasin.set(CLE, JSON.stringify({ choix: "non" }));
  const renvoi = creerRenvoiChoixOffres();
  assert.equal(renvoi.lireEnAttente(), false);
  const vuPendantEnvoi = [];
  const envoyer = async (choix) => {
    vuPendantEnvoi.push([choix, renvoi.lireEnAttente()]);
    return "parti";
  };
  await renvoi.renvoyer(envoyer);
  assert.deepEqual(vuPendantEnvoi, [["non", true]]);
  assert.equal(lireRepere(), null);
  assert.equal(renvoi.lireEnAttente(), false);
});

test("un choix fait avant la relecture du repère gagne sur l'ancien", async () => {
  globalThis.__magasin.set(CLE, JSON.stringify({ choix: "oui" }));
  const renvoi = creerRenvoiChoixOffres();
  const serveur = creerServeur(["parti"]);
  await renvoi.choisir("non", serveur.envoyer);
  assert.deepEqual(serveur.envois, ["non"]);
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
  await renvoi.choisir("oui", serveur.envoyer);
  await renvoi.renvoyer(serveur.envoyer);
  assert.equal(lireRepere(), null);
  assert.equal(renvoi.lireEnAttente(), false);
  assert.deepEqual(lireMinuteriesEnAttente(), []);
});

test("un envoi qui lève une erreur compte comme un échec", async () => {
  const renvoi = creerRenvoiChoixOffres();
  const serveur = creerServeur([new Error("réseau en vrac")]);
  await renvoi.choisir("non", serveur.envoyer);
  assert.equal(lireRepere(), "non");
  assert.equal(renvoi.lireEnAttente(), true);
});

test("app ouverte : nouvel essai dans 30 s, puis 2 min, puis toutes les 10 min, jusqu'au succès", async () => {
  const renvoi = creerRenvoiChoixOffres();
  const serveur = creerServeur(["a-renvoyer", "a-renvoyer", "a-renvoyer", "a-renvoyer", "parti"]);
  await renvoi.choisir("non", serveur.envoyer);
  assert.deepEqual(lireMinuteriesEnAttente(), [30_000]);
  await declencher();
  assert.deepEqual(lireMinuteriesEnAttente(), [120_000]);
  await declencher();
  assert.deepEqual(lireMinuteriesEnAttente(), [600_000]);
  await declencher();
  assert.deepEqual(lireMinuteriesEnAttente(), [600_000]);
  await declencher();
  assert.deepEqual(serveur.envois, ["non", "non", "non", "non", "non"]);
  assert.deepEqual(lireMinuteriesEnAttente(), []);
  assert.equal(lireRepere(), null);
});

test("un retour au premier plan annule la minuterie en cours et repart tout de suite", async () => {
  const renvoi = creerRenvoiChoixOffres();
  const serveur = creerServeur(["a-renvoyer", "parti"]);
  await renvoi.choisir("oui", serveur.envoyer);
  assert.deepEqual(lireMinuteriesEnAttente(), [30_000]);
  await renvoi.renvoyer(serveur.envoyer);
  assert.deepEqual(lireMinuteriesEnAttente(), []);
  assert.deepEqual(serveur.envois, ["oui", "oui"]);
  assert.equal(lireRepere(), null);
});

test("deux retours au premier plan rapprochés ne font qu'un envoi", async () => {
  globalThis.__magasin.set(CLE, JSON.stringify({ choix: "non" }));
  const renvoi = creerRenvoiChoixOffres();
  const serveur = creerServeur(["parti"]);
  await Promise.all([renvoi.renvoyer(serveur.envoyer), renvoi.renvoyer(serveur.envoyer)]);
  assert.deepEqual(serveur.envois, ["non"]);
});

test("un repère illisible est ignoré", async () => {
  globalThis.__magasin.set(CLE, "{pas du json");
  const renvoi = creerRenvoiChoixOffres();
  const serveur = creerServeur();
  await renvoi.renvoyer(serveur.envoyer);
  assert.deepEqual(serveur.envois, []);
});

test("un ancien repère (avant « couper ») est relu : oui ou non", async () => {
  for (const [offres, choix] of [[false, "non"], [true, "oui"]]) {
    globalThis.__magasin = new Map([[CLE, JSON.stringify({ offres })]]);
    const renvoi = creerRenvoiChoixOffres();
    const serveur = creerServeur(["parti"]);
    await renvoi.renvoyer(serveur.envoyer);
    assert.deepEqual(serveur.envois, [choix]);
  }
});

test("un repère inconnu est ignoré", async () => {
  globalThis.__magasin.set(CLE, JSON.stringify({ choix: "peut-etre" }));
  const renvoi = creerRenvoiChoixOffres();
  const serveur = creerServeur();
  await renvoi.renvoyer(serveur.envoyer);
  assert.deepEqual(serveur.envois, []);
});

test("un envoi qui ne finit jamais est lâché au bout d'une minute : le mot s'affiche et le choix suivant part", async () => {
  const renvoi = creerRenvoiChoixOffres();
  const envois = [];
  const valables = [];
  const bloque = (choix, valable) => {
    envois.push(choix);
    valables.push(valable);
    return new Promise(() => {});
  };
  const ok = async (choix) => {
    envois.push(choix);
    return "parti";
  };
  const premier = renvoi.choisir("oui", bloque);
  await pause(5);
  assert.deepEqual(lireMinuteriesEnAttente(), [60_000]);
  assert.equal(valables[0](), true);
  await declencher();
  await premier;
  assert.equal(valables[0](), false, "l'envoi lâché le sait : il ne doit plus rien envoyer");
  assert.equal(renvoi.lireEnAttente(), true);
  assert.equal(lireRepere(), "oui");
  assert.deepEqual(lireMinuteriesEnAttente(), [30_000]);
  await renvoi.choisir("non", ok);
  assert.deepEqual(envois, ["oui", "non"]);
  assert.equal(lireRepere(), null);
  assert.equal(renvoi.lireEnAttente(), false);
  assert.deepEqual(lireMinuteriesEnAttente(), []);
});

test("un envoi qui finit à temps n'est jamais lâché", async () => {
  const renvoi = creerRenvoiChoixOffres();
  let valable = null;
  await renvoi.choisir("non", async (_choix, v) => {
    valable = v;
    return "parti";
  });
  assert.equal(valable(), true);
  assert.deepEqual(lireMinuteriesEnAttente(), []);
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
    const envoyer = async (choix) => {
      await pause(Math.floor(hasard() * 6));
      const tirage = hasard();
      if (tirage < 0.4) {
        serveur = choix;
        return "parti";
      }
      if (tirage < 0.5) throw new Error("coupure");
      return "a-renvoyer";
    };
    const gestes = [];
    let dernier = null;
    for (let i = 0; i < 8; i += 1) {
      if (hasard() < 0.75) {
        dernier = CHOIX[Math.floor(hasard() * CHOIX.length)];
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
    await renvoi.renvoyer(async (choix) => {
      serveur = choix;
      return "parti";
    });
    assert.equal(serveur, dernier, `graine ${graine} : après le retour du réseau`);
    assert.equal(lireRepere(), null);
  }
});
