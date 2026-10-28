import assert from "node:assert/strict";
import { test } from "node:test";

import { declencher, lireMinuteriesEnAttente, oublierMinuteries, pause } from "../synchro-profil/banc/minuteries.mjs";
import { creerRenvoiChoixOffres } from "~/services/renvoi-choix-offres";
import { creerTelephoneNotifications } from "~/services/telephone-notifications";
import { enregistrerReglagesNotifications, lireReglagesNotifications } from "~/stockage/reglages-notifications";

const JETON = "natif-0123456789abcdefghijklmnop";
const CLE_REGLAGES = "sosmiam.reglages-notifications";
const CLE_REPERE = "sosmiam.choix-offres-a-renvoyer";
const CLE_JETON = "sosmiam.jeton-push";
const RELIQUAT = { actives: true, types: { offre: true }, silence: { actif: true, de: "23:00", a: "09:00" } };

function creerServeur() {
  let horloge = 0;
  let enVol = 0;
  const serveur = {
    reseau: true,
    perdreReponse: false,
    lenteur: 0,
    enVolMax: 0,
    lignes: new Map(),
    journal: [],
    async repondre(ecrire) {
      enVol += 1;
      serveur.enVolMax = Math.max(serveur.enVolMax, enVol);
      try {
        if (serveur.lenteur) await pause(serveur.lenteur);
        if (!serveur.reseau) return { ok: false, erreur: "hors-ligne" };
        ecrire();
        return serveur.perdreReponse ? { ok: false, erreur: "hors-ligne" } : { ok: true };
      } finally {
        enVol -= 1;
      }
    },
    inscrire: (i) =>
      serveur.repondre(() => {
        const avant = serveur.lignes.get(i.jeton);
        serveur.lignes.set(i.jeton, { actif: true, offres: i.offres, le: i.offres ? (avant?.le ?? ++horloge) : null });
        serveur.journal.push(["PUT", i.offres]);
      }),
    desinscrire: (jeton) =>
      serveur.repondre(() => {
        serveur.lignes.delete(jeton);
        serveur.journal.push(["DELETE"]);
      }),
    recoitOffres: () => [...serveur.lignes.values()].some((l) => l.actif && l.offres),
    dateAccord: () => serveur.lignes.get(JETON)?.le ?? null,
    accordsEnvoyes: () => serveur.journal.filter(([quoi, offres]) => quoi === "PUT" && offres).length,
  };
  return serveur;
}

function creerMonde() {
  globalThis.__magasin = new Map();
  globalThis.__delaiMagasin = 0;
  oublierMinuteries();
  const serveur = creerServeur();
  const telephone = { permission: "accordee", reponseQuestion: "accordee", questions: 0, lectureBloquee: false };
  const lireJeton = async () => {
    if (telephone.lectureBloquee) return new Promise(() => {});
    if (telephone.permission === "accordee") return { ok: true, jeton: JETON, plateforme: "ios" };
    return { ok: false, raison: telephone.permission === "a-demander" ? "a-demander" : "refusee" };
  };
  const demanderAutorisation = async () => {
    telephone.questions += 1;
    if (telephone.permission === "a-demander") telephone.permission = telephone.reponseQuestion;
  };
  let renvoi = creerRenvoiChoixOffres();
  const app = () =>
    creerTelephoneNotifications({
      appareils: { inscrire: serveur.inscrire, desinscrire: serveur.desinscrire },
      ville: "Montpellier",
      plateforme: "ios",
      lireJeton,
      demanderAutorisation,
      renvoi,
    });

  let derniers = null;
  const modifier = (transformer) => {
    derniers = transformer(derniers);
    return enregistrerReglagesNotifications(derniers);
  };
  const ecran = {
    async ouvrir() {
      derniers = await lireReglagesNotifications();
    },
    async changerOffre(valeur) {
      const ecriture = modifier((r) => ({ ...r, types: { ...r.types, offre: valeur } }));
      const envoi = derniers.actives ? app().choisir(valeur ? "oui" : "non") : undefined;
      await Promise.all([ecriture, envoi]);
      await pause(5);
    },
    async changerActives(actives) {
      const ecriture = modifier((r) => ({ ...r, actives }));
      const envoi = actives ? app().inscrire() : app().couper();
      await Promise.all([ecriture, envoi]);
      await pause(5);
    },
  };

  return {
    serveur,
    telephone,
    ecran,
    enAttente: () => renvoi.lireEnAttente(),
    repere: () => (globalThis.__magasin.has(CLE_REPERE) ? JSON.parse(globalThis.__magasin.get(CLE_REPERE)).choix : null),
    jetonGarde: () => globalThis.__magasin.get(CLE_JETON) ?? null,
    async lancerApp({ avecProfil = true } = {}) {
      renvoi = creerRenvoiChoixOffres();
      oublierMinuteries();
      const t = app();
      const envois = [t.renvoyer()];
      if (avecProfil) {
        const reglages = await lireReglagesNotifications();
        if (reglages.actives) envois.push(t.inscrire());
      }
      await Promise.all(envois);
      await pause(10);
    },
    async revenirAuPremierPlan() {
      await app().renvoyer();
      await pause(10);
    },
    async toutEffacer() {
      await app().effacerReglages();
      derniers = null;
      await pause(10);
    },
    async ecranDitOui() {
      const r = await lireReglagesNotifications();
      return r.actives && r.types.offre;
    },
  };
}

async function partirDe(m, { offre }) {
  await m.lancerApp();
  await m.ecran.ouvrir();
  if (offre) await m.ecran.changerOffre(true);
  assert.equal(m.serveur.recoitOffres(), offre, "départ : le serveur suit l'écran");
}

test("« oui » en attente, notifications coupées hors ligne, puis « Effacer mes données » : le « oui » ne part jamais", async () => {
  const m = creerMonde();
  await partirDe(m, { offre: false });
  m.serveur.reseau = false;
  await m.ecran.changerOffre(true);
  assert.equal(m.repere(), "oui");
  await m.ecran.changerActives(false);
  await m.toutEffacer();
  assert.equal(m.repere(), "couper");
  m.serveur.reseau = true;
  await declencher();
  assert.equal(m.serveur.accordsEnvoyes(), 0, JSON.stringify(m.serveur.journal));
  assert.equal(m.serveur.lignes.size, 0, "le téléphone est bien désinscrit, comme l'écran le disait avant l'effacement");
  assert.equal(m.repere(), null);
  assert.deepEqual(lireMinuteriesEnAttente(), []);
});

test("même chemin, puis quelqu'un d'autre se connecte sur ce téléphone : il n'hérite d'aucun accord", async () => {
  const m = creerMonde();
  await partirDe(m, { offre: false });
  m.serveur.reseau = false;
  await m.ecran.changerOffre(true);
  await m.ecran.changerActives(false);
  await m.toutEffacer();
  m.serveur.reseau = true;
  await m.lancerApp({ avecProfil: true });
  await m.revenirAuPremierPlan();
  assert.equal(await m.ecranDitOui(), false);
  assert.equal(m.serveur.recoitOffres(), false, JSON.stringify(m.serveur.journal));
  assert.equal(m.serveur.dateAccord(), null);
  assert.equal(m.serveur.accordsEnvoyes(), 0);
});

test("« non » en attente puis notifications coupées hors ligne : au retour du réseau, le téléphone est désinscrit", async () => {
  const m = creerMonde();
  await partirDe(m, { offre: true });
  m.serveur.reseau = false;
  await m.ecran.changerOffre(false);
  assert.equal(m.repere(), "non");
  await m.ecran.changerActives(false);
  assert.equal(m.repere(), "couper");
  assert.equal(m.enAttente(), true, "le petit mot reste à l'écran");
  m.serveur.reseau = true;
  await m.revenirAuPremierPlan();
  assert.equal(m.serveur.lignes.size, 0);
  assert.equal(m.repere(), null);
  assert.equal(m.enAttente(), false);
  assert.equal(m.jetonGarde(), null);
  await m.lancerApp();
  assert.equal(m.serveur.lignes.size, 0, "relancée, l'app ne réinscrit pas un téléphone coupé");
});

test("couper hors ligne puis app relancée : la désinscription repart au lancement", async () => {
  const m = creerMonde();
  await partirDe(m, { offre: true });
  m.serveur.reseau = false;
  await m.ecran.changerActives(false);
  assert.equal(m.repere(), "couper");
  assert.deepEqual(lireMinuteriesEnAttente(), [30_000]);
  m.serveur.reseau = true;
  await m.lancerApp();
  assert.equal(m.serveur.recoitOffres(), false);
  assert.equal(m.serveur.lignes.size, 0);
  assert.equal(m.repere(), null);
});

test("couper hors ligne, app ouverte : nouvel essai tout seul dès que le réseau revient", async () => {
  const m = creerMonde();
  await partirDe(m, { offre: true });
  m.serveur.reseau = false;
  await m.ecran.changerActives(false);
  await declencher();
  assert.deepEqual(lireMinuteriesEnAttente(), [120_000]);
  m.serveur.reseau = true;
  await declencher();
  assert.equal(m.serveur.lignes.size, 0);
  assert.deepEqual(lireMinuteriesEnAttente(), []);
});

test("couper hors ligne puis rallumer en ligne : le téléphone reste inscrit, avec le choix de l'écran", async () => {
  const m = creerMonde();
  await partirDe(m, { offre: true });
  m.serveur.reseau = false;
  await m.ecran.changerActives(false);
  m.serveur.reseau = true;
  await m.ecran.changerActives(true);
  await m.revenirAuPremierPlan();
  assert.deepEqual(lireMinuteriesEnAttente(), []);
  assert.deepEqual(m.serveur.journal.at(-1), ["PUT", true]);
  assert.equal(m.serveur.recoitOffres(), true);
  assert.equal(m.repere(), null);
});

test("ancien « oui » d'avant le 15/10, lancement hors ligne : le « non » attend le réseau, puis part sans date d'accord", async () => {
  const m = creerMonde();
  m.serveur.lignes.set(JETON, { actif: true, offres: true, le: 99 });
  globalThis.__magasin.set(CLE_REGLAGES, JSON.stringify(RELIQUAT));
  globalThis.__magasin.set(CLE_JETON, JETON);
  m.serveur.reseau = false;
  await m.lancerApp();
  assert.equal(await m.ecranDitOui(), false);
  assert.equal(m.repere(), "non");
  m.serveur.reseau = true;
  await declencher();
  assert.equal(m.serveur.recoitOffres(), false);
  assert.equal(m.serveur.dateAccord(), null);
  assert.equal(m.serveur.accordsEnvoyes(), 0);
});

test("ancien « oui » d'avant le 15/10 puis effacement sans profil (session expirée) : l'accord du reliquat est retiré quand même", async () => {
  const m = creerMonde();
  m.serveur.lignes.set(JETON, { actif: true, offres: true, le: 99 });
  globalThis.__magasin.set(CLE_REGLAGES, JSON.stringify(RELIQUAT));
  globalThis.__magasin.set(CLE_JETON, JETON);
  await m.lancerApp({ avecProfil: false });
  await m.toutEffacer();
  assert.equal(m.serveur.recoitOffres(), false);
  assert.equal(m.serveur.dateAccord(), null);
});

test("réponse perdue d'un « oui », puis autorisation retirée dans le système : le « non » retire quand même l'accord", async () => {
  const m = creerMonde();
  await partirDe(m, { offre: false });
  globalThis.__magasin.delete(CLE_JETON);
  m.serveur.perdreReponse = true;
  await m.ecran.changerOffre(true);
  assert.equal(m.serveur.recoitOffres(), true, "le serveur a bien reçu le « oui », mais la réponse s'est perdue");
  m.serveur.perdreReponse = false;
  m.telephone.permission = "refusee";
  await m.ecran.changerOffre(false);
  assert.equal(await m.ecranDitOui(), false);
  assert.equal(m.serveur.recoitOffres(), false, JSON.stringify(m.serveur.journal));
  assert.equal(m.serveur.dateAccord(), null);
});

test("effacement en ligne avec les offres allumées : l'accord est retiré", async () => {
  const m = creerMonde();
  await partirDe(m, { offre: true });
  await m.toutEffacer();
  assert.equal(m.serveur.recoitOffres(), false);
  assert.equal(m.serveur.dateAccord(), null);
});

test("effacement hors ligne avec les offres allumées : retiré au lancement suivant, même sans profil", async () => {
  const m = creerMonde();
  await partirDe(m, { offre: true });
  m.serveur.reseau = false;
  await m.toutEffacer();
  m.serveur.reseau = true;
  await m.lancerApp({ avecProfil: false });
  assert.equal(m.serveur.recoitOffres(), false);
  assert.equal(m.repere(), null);
});

test("bascules rapides en ligne : le serveur finit sur le dernier choix, un envoi à la fois", async () => {
  const m = creerMonde();
  await partirDe(m, { offre: false });
  m.serveur.lenteur = 3;
  await Promise.all([true, false, true, false, true].map((v) => m.ecran.changerOffre(v)));
  await pause(40);
  assert.equal(m.serveur.recoitOffres(), true);
  assert.equal(m.serveur.enVolMax, 1);
});

test("rallumer les notifications (« oui » lent) puis éteindre les offres : jamais deux envois en même temps, le « non » arrive en dernier", async () => {
  const m = creerMonde();
  await partirDe(m, { offre: true });
  await m.ecran.changerActives(false);
  m.serveur.lenteur = 20;
  const rallumer = m.ecran.changerActives(true);
  await pause(5);
  await Promise.all([rallumer, m.ecran.changerOffre(false)]);
  await pause(60);
  assert.deepEqual(m.serveur.journal.slice(-2), [["PUT", true], ["PUT", false]]);
  assert.equal(m.serveur.recoitOffres(), false);
  assert.equal(m.serveur.enVolMax, 1);
});

test("premier lancement : la question du système est posée une fois, puis le téléphone s'inscrit sans accord", async () => {
  const m = creerMonde();
  m.telephone.permission = "a-demander";
  await m.lancerApp();
  assert.equal(m.telephone.questions, 1);
  assert.deepEqual(m.serveur.journal, [["PUT", false]]);
  assert.equal(m.serveur.dateAccord(), null);
});

test("question refusée : rien ne part, aucun repère", async () => {
  const m = creerMonde();
  m.telephone.permission = "a-demander";
  m.telephone.reponseQuestion = "refusee";
  await m.lancerApp();
  assert.deepEqual(m.serveur.journal, []);
  assert.equal(m.repere(), null);
  assert.deepEqual(lireMinuteriesEnAttente(), []);
});

test("éteindre les offres : la question du système n'est jamais posée", async () => {
  const m = creerMonde();
  await partirDe(m, { offre: true });
  const questions = m.telephone.questions;
  m.telephone.permission = "a-demander";
  await m.ecran.changerOffre(false);
  await m.ecran.changerActives(false);
  assert.equal(m.telephone.questions, questions);
  assert.equal(m.serveur.lignes.size, 0);
});

test("jeton du téléphone qui ne vient jamais : le choix suivant n'est pas bloqué", async () => {
  const m = creerMonde();
  await partirDe(m, { offre: false });
  m.telephone.lectureBloquee = true;
  const oui = m.ecran.changerOffre(true);
  await pause(5);
  await declencher(5);
  await oui;
  assert.equal(m.repere(), "oui");
  assert.equal(m.enAttente(), true);
  await m.ecran.changerActives(false);
  assert.equal(m.serveur.lignes.size, 0, "couper part avec le jeton gardé, sans attendre le téléphone");
  assert.equal(m.repere(), null);
  assert.equal(m.serveur.accordsEnvoyes(), 0);
});
