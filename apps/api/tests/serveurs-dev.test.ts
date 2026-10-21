import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import {
  ACTIONS_SERVEUR, DELAI_ACTION_PM2, creerExecuteurPm2, creerPiloteServeurs, mesurerMemoireArbre, traduireErreurPm2, type ExecuterPm2,
} from "../src/services/gestion/serveurs-dev.ts";
import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

const LANCEMENT = Date.parse("2026-10-22T08:00:00.000Z");
const AUTRES_PROJETS = ["fib-api", "fib-discord-bot", "fib-web-dev", "fondation-api", "fondation-web", "discord-bot", "tabuladb-bot"];

type Faux = { nom: string; statut: string; pid?: number };

function creerFauxPm2(depart: Faux[]) {
  const processus = new Map(depart.map((p) => [p.nom, { ...p }]));
  const appels: string[][] = [];
  const liste = () => [...processus.values()].map((p, i) => ({
    name: p.nom,
    pid: p.statut === "online" ? (p.pid ?? 100 + i) : 0,
    pm_id: i,
    pm2_env: { status: p.statut, pm_uptime: LANCEMENT, restart_time: 3, env: { DATABASE_URL: "postgres://secret-de-la-base", SECRET_FIB: "chut-fib" } },
    monit: { memory: 1_000_000, cpu: 1 },
  }));
  const executer: ExecuterPm2 = async (arguments_, delai) => {
    appels.push([...arguments_]);
    assert.ok(delai > 0 && delai <= DELAI_ACTION_PM2);
    const [commande, nom] = arguments_;
    if (commande === "jlist") return `>>>> In-memory PM2 is out-of-date, do:\n>>>> $ pm2 update\n${JSON.stringify(liste())}\n`;
    const cible = nom ? processus.get(nom) : undefined;
    if (!cible) throw Object.assign(new Error("Command failed"), { code: 1, stderr: `[PM2][ERROR] Process or Namespace ${nom} not found` });
    cible.statut = commande === "stop" ? "stopped" : "online";
    return `┌────┬ fib-api │ tabuladb-bot │ fondation-web │ ${nom} ┐`;
  };
  return { executer, appels, processus };
}

const VPS: Faux[] = [
  ...AUTRES_PROJETS.map((nom) => ({ nom, statut: "online" })),
  { nom: "sos-miam-site-dev", statut: "online", pid: 21 },
  { nom: "sos-miam-site", statut: "online", pid: 22 },
  { nom: "sos-miam-app-dev", statut: "stopped" },
  { nom: "sos-miam-api", statut: "online", pid: 24 },
  { nom: "sos-miam-preview", statut: "online", pid: 25 },
];

const mesurerMemoire = async (pid: number) => pid * 1_000_000;

test("seuls les cinq processus de la liste fermée sont montrés, dans l'ordre, sans rien des autres projets", async () => {
  const faux = creerFauxPm2(VPS);
  const pilote = creerPiloteServeurs({ executer: faux.executer, mesurerMemoire });
  const etat = await pilote.lireServeurs();
  assert.equal(etat.pm2Repond, true);
  assert.equal(etat.actionEnCours, null);
  assert.deepEqual(etat.serveurs.map((s) => [s.id, s.processus, s.pilotable, s.etat]), [
    ["app-dev", "sos-miam-app-dev", true, "arrete"],
    ["site-dev", "sos-miam-site-dev", true, "en-ligne"],
    ["api", "sos-miam-api", false, "en-ligne"],
    ["site", "sos-miam-site", false, "en-ligne"],
    ["bot-discord", "sos-miam-bot-discord", false, "absent"],
  ]);
  const siteDev = etat.serveurs[1]!;
  assert.deepEqual(
    { depuis: siteDev.depuis, memoire: siteDev.memoire, redemarrages: siteDev.redemarrages, statutPm2: siteDev.statutPm2 },
    { depuis: "2026-10-22T08:00:00.000Z", memoire: 21_000_000, redemarrages: 3, statutPm2: "online" },
  );
  assert.deepEqual({ depuis: etat.serveurs[0]!.depuis, memoire: etat.serveurs[0]!.memoire }, { depuis: null, memoire: null });
  const texte = JSON.stringify(etat);
  for (const autre of [...AUTRES_PROJETS, "sos-miam-preview"]) assert.ok(!texte.includes(`"${autre}"`), autre);
  for (const mot of ["fib", "tabuladb", "fondation", "secret", "chut", "env"]) assert.ok(!texte.includes(mot), mot);
  assert.deepEqual(faux.appels, [["jlist"]]);
});

test("sans mesure de l'arbre, la mémoire de pm2 sert ; pm2 muet ou illisible : rien d'inventé", async () => {
  const faux = creerFauxPm2(VPS);
  const sansArbre = await creerPiloteServeurs({ executer: faux.executer, mesurerMemoire: async () => null }).lireServeurs();
  assert.equal(sansArbre.serveurs[1]!.memoire, 1_000_000);
  for (const panne of [
    async () => { throw Object.assign(new Error("spawn pm2 ENOENT"), { code: "ENOENT" }); },
    async () => "Pas du JSON [PM2] du tout",
  ] satisfies ExecuterPm2[]) {
    const etat = await creerPiloteServeurs({ executer: panne, mesurerMemoire }).lireServeurs();
    assert.equal(etat.pm2Repond, false);
    assert.deepEqual(etat.serveurs.map((s) => s.etat), ["inconnu", "inconnu", "inconnu", "inconnu", "inconnu"]);
    assert.ok(etat.serveurs.every((s) => s.memoire === null && s.depuis === null && s.redemarrages === null));
  }
});

test("allumer, éteindre, redémarrer : des arguments fixes, le nom pm2 venu de la liste fermée", async () => {
  const faux = creerFauxPm2(VPS);
  const pilote = creerPiloteServeurs({ executer: faux.executer, mesurerMemoire });
  const allume = await pilote.piloterServeur("app-dev", "allumer");
  assert.equal(allume.ok, true);
  assert.equal(allume.ok && allume.etat?.etat, "en-ligne");
  const eteint = await pilote.piloterServeur("site-dev", "eteindre");
  assert.equal(eteint.ok && eteint.etat?.etat, "arrete");
  const redemarre = await pilote.piloterServeur("app-dev", "redemarrer");
  assert.equal(redemarre.ok && redemarre.etat?.etat, "en-ligne");
  assert.deepEqual(faux.appels, [
    ["jlist"], ["restart", "sos-miam-app-dev"], ["jlist"],
    ["jlist"], ["stop", "sos-miam-site-dev"], ["jlist"],
    ["jlist"], ["restart", "sos-miam-app-dev"], ["jlist"],
  ]);
});

test("refusés sans jamais appeler pm2 : nom inconnu, nom pm2 brut, autre projet, lecture seule, action inconnue", async () => {
  const faux = creerFauxPm2(VPS);
  const pilote = creerPiloteServeurs({ executer: faux.executer, mesurerMemoire });
  const inconnus = [
    "sos-miam-app-dev", "sos-miam-api", ...AUTRES_PROJETS, "../app-dev", "app-dev;reboot", "app-dev all", "all", "APP-DEV", " app-dev",
    "__proto__", "constructor", "toString", "hasOwnProperty", "", "0", "11",
  ];
  for (const id of inconnus) assert.deepEqual(await pilote.piloterServeur(id, "eteindre"), { ok: false, erreur: "serveur-inconnu" }, id);
  for (const id of ["api", "site", "bot-discord"]) {
    for (const action of [...ACTIONS_SERVEUR, "supprimer"]) {
      const refus = await pilote.piloterServeur(id, action);
      assert.equal(!refus.ok && refus.erreur, "lecture-seule", `${id} ${action}`);
    }
  }
  for (const action of ["stop", "start", "restart", "delete", "kill", "supprimer", "", "constructor", "eteindre all"]) {
    const refus = await pilote.piloterServeur("app-dev", action);
    assert.equal(!refus.ok && refus.erreur, "action-inconnue", action);
  }
  assert.deepEqual(faux.appels, []);
});

test("déjà allumé, déjà éteint, ou disparu de pm2 : rien n'est lancé", async () => {
  const faux = creerFauxPm2(VPS.filter((p) => p.nom !== "sos-miam-site-dev"));
  const pilote = creerPiloteServeurs({ executer: faux.executer, mesurerMemoire });
  assert.equal(await pilote.piloterServeur("app-dev", "eteindre").then((r) => !r.ok && r.erreur), "deja-eteint");
  await pilote.piloterServeur("app-dev", "allumer");
  assert.equal(await pilote.piloterServeur("app-dev", "allumer").then((r) => !r.ok && r.erreur), "deja-allume");
  assert.equal(await pilote.piloterServeur("site-dev", "allumer").then((r) => !r.ok && r.erreur), "serveur-absent");
  assert.deepEqual(faux.appels.filter((appel) => appel[0] !== "jlist"), [["restart", "sos-miam-app-dev"]]);
});

test("une seule action à la fois, et le verrou se libère même après une erreur", async () => {
  const faux = creerFauxPm2(VPS);
  let liberer: () => void = () => {};
  let bloquer = true;
  let echouer = false;
  const executer: ExecuterPm2 = async (arguments_, delai) => {
    if (arguments_[0] !== "jlist" && bloquer) await new Promise<void>((suite) => (liberer = suite));
    if (arguments_[0] !== "jlist" && echouer) throw Object.assign(new Error("Command failed"), { code: 1, stderr: "[PM2][ERROR] Ça coince" });
    return faux.executer(arguments_, delai);
  };
  const pilote = creerPiloteServeurs({ executer, mesurerMemoire, horloge: () => new Date("2026-10-22T09:30:00.000Z") });
  const premiere = pilote.piloterServeur("site-dev", "redemarrer");
  const pendant = await pilote.piloterServeur("app-dev", "allumer");
  assert.deepEqual(pendant.ok === false && pendant.erreur === "action-en-cours" && pendant.enCours, { id: "site-dev", action: "redemarrer", depuis: "2026-10-22T09:30:00.000Z" });
  assert.deepEqual((await pilote.lireServeurs()).actionEnCours, { id: "site-dev", action: "redemarrer", depuis: "2026-10-22T09:30:00.000Z" });
  await new Promise((suite) => setTimeout(suite, 10));
  liberer();
  assert.equal((await premiere).ok, true);
  assert.equal((await pilote.lireServeurs()).actionEnCours, null);
  bloquer = false;
  echouer = true;
  assert.equal(await pilote.piloterServeur("app-dev", "allumer").then((r) => !r.ok && r.erreur), "pm2-erreur");
  echouer = false;
  assert.equal((await pilote.piloterServeur("app-dev", "allumer")).ok, true);
});

test("erreurs de pm2 traduites, sans rien recopier de sa sortie hors de la ligne d'erreur", async () => {
  assert.deepEqual(traduireErreurPm2(Object.assign(new Error("spawn pm2 ENOENT"), { code: "ENOENT" })), { erreur: "pm2-introuvable", message: null });
  assert.deepEqual(traduireErreurPm2(Object.assign(new Error("Command failed"), { killed: true, signal: "SIGKILL", code: null })), { erreur: "pm2-trop-long", message: null });
  const echap = String.fromCharCode(27);
  const sortie = `${echap}[31m[PM2][ERROR] Process or Namespace sos-miam-app-dev not found${echap}[39m\n│ fib-api │ online │ tabuladb-bot │\nDATABASE_URL=postgres://secret`;
  assert.deepEqual(traduireErreurPm2(Object.assign(new Error("Command failed"), { code: 1, stderr: sortie })), { erreur: "pm2-erreur", message: "Process or Namespace sos-miam-app-dev not found" });
  assert.deepEqual(traduireErreurPm2(Object.assign(new Error("Command failed"), { code: 1, stderr: "│ fib-api │ secret │" })), { erreur: "pm2-erreur", message: null });
  assert.deepEqual(traduireErreurPm2("bizarre"), { erreur: "pm2-erreur", message: null });

  const faux = creerFauxPm2(VPS);
  const casse: ExecuterPm2 = async (arguments_, delai) => {
    if (arguments_[0] === "stop") throw Object.assign(new Error("Command failed"), { code: 1, stderr: `${sortie}\n[PM2][ERROR] deuxième ligne` });
    return faux.executer(arguments_, delai);
  };
  const resultat = await creerPiloteServeurs({ executer: casse, mesurerMemoire }).piloterServeur("site-dev", "eteindre");
  assert.equal(resultat.ok, false);
  assert.ok(!resultat.ok && resultat.erreur === "pm2-erreur" && resultat.message === "Process or Namespace sos-miam-app-dev not found");
  assert.ok(!JSON.stringify(resultat).includes("fib") && !JSON.stringify(resultat).includes("secret"));
});

test("le vrai exécuteur : liste d'arguments sans shell, environnement réduit, délai, binaire absent", async () => {
  process.env.SECRET_ESSAI_SERVEURS = "ne-doit-pas-passer";
  const noeud = creerExecuteurPm2(process.execPath);
  const pieges = ["$(echo pirate)", "a;b && c", "`id`", "> /dev/null", "'\""];
  assert.equal(await noeud(["-e", "process.stdout.write(JSON.stringify(process.argv.slice(1)))", ...pieges], 10_000), JSON.stringify(pieges));
  const cles = JSON.parse(await noeud(["-e", "process.stdout.write(JSON.stringify(Object.keys(process.env)))"], 10_000)) as string[];
  assert.ok(cles.includes("PATH") && cles.includes("HOME"));
  assert.ok(cles.every((cle) => ["PATH", "HOME", "PM2_HOME"].includes(cle)), cles.join(","));
  const debut = Date.now();
  const lent = await noeud(["-e", "setTimeout(() => {}, 20000)"], 300).then(() => null, (erreur: unknown) => traduireErreurPm2(erreur));
  assert.deepEqual(lent, { erreur: "pm2-trop-long", message: null });
  assert.ok(Date.now() - debut < 5000);
  const echec = await noeud(["-e", "console.error('[PM2][ERROR] Process or Namespace x not found'); process.exit(1)"], 10_000).then(() => null, (erreur: unknown) => traduireErreurPm2(erreur));
  assert.deepEqual(echec, { erreur: "pm2-erreur", message: "Process or Namespace x not found" });
  const absent = await creerExecuteurPm2("/inexistant/pm2")(["jlist"], 1000).then(() => null, (erreur: unknown) => traduireErreurPm2(erreur));
  assert.deepEqual(absent, { erreur: "pm2-introuvable", message: null });
  delete process.env.SECRET_ESSAI_SERVEURS;
});

test("la mémoire d'un serveur compte tout son arbre de processus, lu dans /proc", async () => {
  const enfant = (await import("node:child_process")).spawn(process.execPath, ["-e", "setTimeout(() => {}, 5000)"], { stdio: "ignore" });
  await new Promise((suite) => setTimeout(suite, 300));
  const seul = (await import("node:fs/promises")).readFile(`/proc/${enfant.pid}/status`, "utf8").then((statut) => Number(/^VmRSS:\s+(\d+)/m.exec(statut)?.[1]) * 1024);
  const arbre = await mesurerMemoireArbre(process.pid);
  enfant.kill("SIGKILL");
  assert.ok(arbre !== null && arbre >= process.memoryUsage().rss * 0.8 + (await seul) * 0.8, String(arbre));
  assert.equal(await mesurerMemoireArbre(999_999_999), null);
});

const journal: { poste: string; action: string; detail: string | undefined }[] = [];
const fauxBanc = creerFauxPm2(VPS);
let pannePm2 = false;
const executerBanc: ExecuterPm2 = async (arguments_, delai) => {
  if (pannePm2 && arguments_[0] !== "jlist") throw Object.assign(new Error("Command failed"), { code: 1, stderr: "[PM2][ERROR] Script not found" });
  return fauxBanc.executer(arguments_, delai);
};
const piloteBanc = creerPiloteServeurs({ executer: executerBanc, mesurerMemoire });
const banc = await creerBancGestion({
  noterAction: async (poste: string, action: string, detail?: string) => void journal.push({ poste, action, detail }),
  lireServeursDev: piloteBanc.lireServeurs,
  piloterServeurDev: piloteBanc.piloterServeur,
});
let session = "";
before(async () => void (session = await banc.ouvrirSession()));
after(() => banc.fermer());

test("routes : liste protégée, action notée au journal avec le poste", async () => {
  assert.equal((await banc.demander("GET", "/serveurs")).status, 401);
  const liste = await banc.demander("GET", "/serveurs", { session });
  assert.equal(liste.status, 200);
  const corps = (await liste.json()) as { pm2Repond: boolean; serveurs: { id: string }[] };
  assert.deepEqual(corps.serveurs.map((s) => s.id), ["app-dev", "site-dev", "api", "site", "bot-discord"]);
  assert.ok(!JSON.stringify(corps).includes("fib"));

  const eteint = await banc.demander("POST", "/serveurs/site-dev/action", { session, corps: { action: "eteindre" } });
  assert.equal(eteint.status, 200);
  const reponse = (await eteint.json()) as { ok: boolean; serveur: { id: string; etat: string } };
  assert.deepEqual([reponse.ok, reponse.serveur.id, reponse.serveur.etat], [true, "site-dev", "arrete"]);
  assert.deepEqual(journal.at(-1), { poste: "PC de test", action: "Serveur de dev éteint", detail: "sos-miam-site-dev" });

  const deja = await banc.demander("POST", "/serveurs/site-dev/action", { session, corps: { action: "eteindre" } });
  assert.equal(deja.status, 409);
  assert.deepEqual(await deja.json(), { ok: false, erreur: "deja-eteint" });
  assert.equal((await banc.demander("POST", "/serveurs/site-dev/action", { session, corps: { action: "allumer" } })).status, 200);
  assert.equal(journal.at(-1)?.action, "Serveur de dev allumé");
});

test("routes : refus clairs (inconnu 404, lecture seule 403 noté, action 400, erreur de pm2 503 avec sa ligne)", async () => {
  const avant = fauxBanc.appels.length;
  for (const id of ["sos-miam-app-dev", "fib-api", "tabuladb-bot", "%2E%2E%2Fapp-dev", "constructor"]) {
    const reponse = await banc.demander("POST", `/serveurs/${id}/action`, { session, corps: { action: "eteindre" } });
    assert.equal(reponse.status, 404, id);
    assert.deepEqual(await reponse.json(), { ok: false, erreur: "serveur-inconnu" });
  }
  const api = await banc.demander("POST", "/serveurs/api/action", { session, corps: { action: "eteindre" } });
  assert.equal(api.status, 403);
  assert.deepEqual(await api.json(), { ok: false, erreur: "lecture-seule" });
  assert.deepEqual(journal.at(-1), { poste: "PC de test", action: "Serveur : action refusée", detail: "sos-miam-api · eteindre (lecture seule)" });
  for (const corps of [{ action: "delete" }, { action: 3 }, {}, { action: "stop" }]) {
    const reponse = await banc.demander("POST", "/serveurs/app-dev/action", { session, corps });
    assert.equal(reponse.status, 400);
    assert.deepEqual(await reponse.json(), { ok: false, erreur: "champ-invalide", champ: "action" });
  }
  assert.equal(fauxBanc.appels.length, avant);

  pannePm2 = true;
  const panne = await banc.demander("POST", "/serveurs/app-dev/action", { session, corps: { action: "allumer" } });
  pannePm2 = false;
  assert.equal(panne.status, 503);
  assert.deepEqual(await panne.json(), { ok: false, erreur: "pm2-erreur", message: "Script not found" });
  assert.deepEqual(journal.at(-1), { poste: "PC de test", action: "Serveur de dev : allumage raté", detail: "sos-miam-app-dev · pm2-erreur · Script not found" });
});
