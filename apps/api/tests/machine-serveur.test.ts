import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";

import {
  lireCharge, lireCompteursReseau, lireInfosMemoire, lireStatProcesseur, trouverInterfacePrincipale, type Instantane,
} from "../src/services/gestion/mesures-machine.ts";
import { calculerPoint, creerReleveMachine, moyenner, regrouper, type PointMachine } from "../src/services/gestion/releve-machine.ts";
import {
  compterMisesAJour, decrireProgramme, lireEtatsServices, lireNomSysteme, lireSortieTop, SERVICES_SYSTEME,
} from "../src/services/gestion/systeme-machine.ts";
import type { EtatServiceSysteme } from "../src/services/gestion/systeme-machine.ts";
import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

const dossiers: string[] = [];
after(async () => {
  await Promise.all(dossiers.map((dossier) => rm(dossier, { recursive: true, force: true })));
});
async function creerDossier() {
  const dossier = await mkdtemp(join(tmpdir(), "sos-miam-mesures-"));
  dossiers.push(dossier);
  return dossier;
}

const GO = 1024 ** 3;
const DEBUT = Date.parse("2026-10-22T10:00:00.000Z");

function instantane(minute: number, { occupe = 0.2, memoireLibre = 20 * GO, recu = 0, temperature = 40 }: { occupe?: number; memoireLibre?: number; recu?: number; temperature?: number } = {}): Instantane {
  const total = 6000 * minute;
  return {
    le: DEBUT + minute * 60_000,
    coeurs: 16,
    processeur: { total, inactif: total * (1 - occupe) },
    memoire: { total: 32 * GO, disponible: memoireLibre },
    echange: { total: 4 * GO, libre: 4 * GO },
    disque: { total: 438 * GO, libre: 376 * GO, utilise: 62 * GO },
    reseau: { interface: "primary0", recu, envoye: recu * 2 },
    charge: [1, 1, 1],
    temperature,
    allumeDepuis: DEBUT - 3_600_000,
  };
}

function suite(instantanes: Instantane[]) {
  let rang = 0;
  return async () => instantanes[Math.min(rang++, instantanes.length - 1)] as Instantane;
}

test("les fichiers de /proc se lisent sans rien inventer", () => {
  assert.deepEqual(lireStatProcesseur("cpu  100 0 50 800 50 0 0 0 0 0\ncpu0 1 2 3 4\n"), { total: 1000, inactif: 850 });
  assert.equal(lireStatProcesseur("intr 12\n"), null);
  const infos = lireInfosMemoire("MemTotal:       32767000 kB\nMemFree: 1 kB\nMemAvailable:   22000000 kB\nSwapTotal:       4194300 kB\nSwapFree:        4194300 kB\n");
  assert.deepEqual(infos.memoire, { total: 32767000 * 1024, disponible: 22000000 * 1024 });
  assert.deepEqual(infos.echange, { total: 4194300 * 1024, libre: 4194300 * 1024 });
  assert.equal(lireInfosMemoire("rien").memoire, null);
  const route = "Iface\tDestination\tGateway\nprimary0\t00000000\t01A6912D\nprimary0\t00A6912D\t00000000\n";
  assert.equal(trouverInterfacePrincipale(route), "primary0");
  const dev = "Inter-|   Receive\n face |bytes packets\n    lo: 999999 1 0 0 0 0 0 0 999999 1 0 0 0 0 0 0\nprimary0: 3000 5 0 0 0 0 0 0 7000 6 0 0 0 0 0 0\n  eno2: 10 1 0 0 0 0 0 0 20 1 0 0 0 0 0 0\n";
  assert.deepEqual(lireCompteursReseau(dev, "primary0"), { interface: "primary0", recu: 3000, envoye: 7000 });
  assert.deepEqual(lireCompteursReseau(dev, null), { interface: "primary0", recu: 3000, envoye: 7000 });
  assert.deepEqual(lireCharge("10.58 9.61 7.73 7/1079 302192\n"), [10.58, 9.61, 7.73]);
  assert.equal(lireCharge("n'importe quoi"), null);
});

test("un point se calcule entre deux relevés, et rien quand les compteurs repartent de zéro", () => {
  const point = calculerPoint(instantane(0, { recu: 0 }), instantane(1, { occupe: 0.35, recu: 6000 }));
  assert.equal(point.processeur, 35);
  assert.equal(point.recu, 100);
  assert.equal(point.envoye, 200);
  assert.equal(point.memoire, 12 * GO);
  assert.equal(point.disque, 62 * GO);
  const apresRedemarrage = calculerPoint(instantane(5, { recu: 90_000 }), { ...instantane(6), reseau: { interface: "primary0", recu: 10, envoye: 10 } });
  assert.equal(apresRedemarrage.recu, null);
  assert.equal(apresRedemarrage.envoye, null);
});

test("les moyennes ignorent les trous, et les paquets suivent le pas demandé", () => {
  const points: PointMachine[] = [0, 1, 2, 10, 11].map((minute, rang) => ({
    le: new Date(DEBUT + minute * 60_000).toISOString(), processeur: rang === 1 ? null : 10 * (rang + 1), memoire: 1, recu: 1, envoye: 1, disque: 1, temperature: null,
  }));
  assert.equal(moyenner(points.slice(0, 3), "x").processeur, 20);
  assert.equal(moyenner(points, "x").temperature, null);
  const paquets = regrouper(points, DEBUT, DEBUT + 20 * 60_000, 10 * 60_000);
  assert.equal(paquets.length, 2);
  assert.equal(paquets[0]?.le, new Date(DEBUT).toISOString());
  assert.equal(paquets[1]?.processeur, 45);
});

test("le relevé garde 24 h de minutes et 30 jours d'heures dans son fichier, et les relit au démarrage", async () => {
  const dossier = await creerDossier();
  let maintenant = DEBUT;
  const instantanes = Array.from({ length: 6 }, (_, minute) => instantane(minute, { occupe: 0.6, recu: minute * 6000 }));
  const releve = creerReleveMachine({ dossier, lire: suite(instantanes), horloge: () => maintenant });
  assert.equal(await releve.relever(), null);
  for (let minute = 1; minute < 6; minute++) {
    maintenant = DEBUT + minute * 60_000;
    assert.ok(await releve.relever());
  }
  const courbes = await releve.lireCourbes("1h");
  assert.equal(courbes.points.length, 5);
  assert.equal(courbes.points.at(-1)?.processeur, 60);
  assert.equal(courbes.memoireTotale, 32 * GO);
  const enregistre = JSON.parse(await readFile(join(dossier, "mesures-machine.json"), "utf8")) as { minutes: unknown[]; heures: unknown[] };
  assert.equal(enregistre.minutes.length, 5);
  assert.equal(enregistre.heures.length, 1);
  const maintenantRelu = creerReleveMachine({ dossier, lire: suite([instantane(6)]), horloge: () => maintenant });
  assert.equal((await maintenantRelu.lireCourbes("1h")).points.length, 5);
  assert.equal((await maintenantRelu.lireCourbes("7j")).points.length, 1);
  const etat = releve.lireMaintenant();
  assert.equal(etat?.processeur, 60);
  assert.equal(etat?.coeurs, 16);
  assert.deepEqual(etat?.disque, { total: 438 * GO, libre: 376 * GO });
  assert.equal(etat?.derniereHeure.length, 5);
});

test("les alertes suivent les seuils choisis par Hugo", async () => {
  const dossier = await creerDossier();
  let maintenant = DEBUT;
  const chargees = Array.from({ length: 12 }, (_, minute) => instantane(minute, { occupe: 0.95 }));
  let services: EtatServiceSysteme[] = SERVICES_SYSTEME.map((service) => ({ ...service, actif: true, etat: "active" }));
  const releve = creerReleveMachine({ dossier, lire: suite(chargees), lireServices: async () => services, horloge: () => maintenant });
  for (let minute = 0; minute < 10; minute++) {
    maintenant = DEBUT + minute * 60_000;
    await releve.relever();
  }
  assert.deepEqual(releve.lireProblemes(), []);
  maintenant = DEBUT + 10 * 60_000;
  await releve.relever();
  assert.deepEqual(releve.lireProblemes(), ["Le processeur tourne à plus de 90 % depuis 10 minutes."]);
  services = services.map((service) => (service.unite === "nginx" ? { ...service, actif: false, etat: "failed" } : service));
  maintenant = DEBUT + 11 * 60_000;
  await releve.relever();
  assert.ok(releve.lireProblemes().includes("Le service nginx est arrêté."));
  maintenant = DEBUT + 16 * 60_000;
  assert.ok(releve.lireProblemes().includes("Le relevé du serveur ne répond plus depuis 5 minutes."));

  const pleine = creerReleveMachine({ dossier: await creerDossier(), lire: suite([instantane(0, { memoireLibre: 2 * GO, temperature: 85 })]), horloge: () => DEBUT });
  await pleine.relever();
  assert.deepEqual(pleine.lireProblemes(), ["La mémoire du serveur est pleine à 94 %.", "Le processeur chauffe : 85 °C."]);
});

test("les services, top, apt et os-release se lisent tels que le VPS les écrit", () => {
  const etats = lireEtatsServices("active\nactive\ninactive\nactive\nactive\nactive\n");
  assert.equal(etats.length, SERVICES_SYSTEME.length);
  assert.deepEqual(etats.filter((etat) => !etat.actif).map((etat) => etat.nom), ["Stalwart"]);
  assert.equal(lireEtatsServices("").every((etat) => etat.etat === "inconnu" && !etat.actif), true);
  const top = [
    "top - 12:06:29 up 14:05,  0 user,  load average: 1.80, 2.32, 1.10",
    "    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND",
    "      1 root      20   0  168244  12864   9260 S  99.0   0.0   0:05.07 systemd",
    "top - 12:06:30 up 14:05,  0 user,  load average: 1.80, 2.32, 1.10",
    "Tasks: 305 total,   1 running, 304 sleeping,   0 stopped,   0 zombie",
    "",
    "    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND",
    " 421295 root      20   0 5689204 515200 145336 S 180.0   1.6   7:14.72 chrome-headless",
    " 539024 root      20   0 1128576  75800  51888 S   2.0   0.2   0:20.63 node",
    " 539025 root      20   0 1128576  75800  51888 S   3.0   0.2   0:20.63 node",
    " 678739 root      20   0    8616   4876   2832 R   9.0   0.0   0:00.02 top",
    "      2 root      20   0       0      0      0 S   0.0   0.0   0:00.02 kthreadd",
  ].join("\n");
  assert.deepEqual(lireSortieTop(top), [
    { nom: "chrome-headless", coeurs: 1.8, role: "Le navigateur des essais (captures d'écran)" },
    { nom: "node", coeurs: 0.05, role: "Programmes Node : API, sites, bots" },
  ]);
  assert.deepEqual(lireSortieTop("rien du tout"), []);
  assert.equal(compterMisesAJour("Listing...\nphp8.2/bookworm-security 8.2.36 amd64 [upgradable from: 8.2.35]\nlibc6/bookworm 2.36 amd64 [upgradable from: 2.35]\n"), 2);
  assert.equal(compterMisesAJour("Listing...\n"), 0);
  assert.equal(lireNomSysteme('NAME="Debian"\nPRETTY_NAME="Debian GNU/Linux 12 (bookworm)"\n'), "Debian GNU/Linux 12 (bookworm)");
  assert.equal(decrireProgramme("code-2d0b7506a3"), "VS Code, à distance");
  assert.equal(decrireProgramme("inconnu"), null);
});

test("les routes de la machine : protégées, une seule machine, période par défaut 24 h", async () => {
  const demandes: string[] = [];
  const banc = await creerBancGestion({
    lireMachines: async () => ({ machines: [] }),
    lireCourbesMachine: async (id, periode) => {
      demandes.push(`${id}:${periode}`);
      return id === "vps" ? ({ periode, points: [] } as never) : null;
    },
    lireSystemeMachine: async (id) => (id === "vps" ? ({ services: [], sante: null, gourmands: [] } as never) : null),
    listerSourcesJournaux: async () => ({ sources: [] }),
    lireJournalServeur: async (id, filtre) => (id === "api" ? ({ id, filtre, lignes: [] } as never) : null),
  });
  try {
    assert.equal((await banc.demander("GET", "/maintenance/machines")).status, 401);
    const session = await banc.ouvrirSession();
    assert.equal((await banc.demander("GET", "/maintenance/machines", { session })).status, 200);
    assert.equal((await banc.demander("GET", "/maintenance/machines/vps/courbes?periode=7j", { session })).status, 200);
    assert.equal((await banc.demander("GET", "/maintenance/machines/vps/courbes?periode=10ans", { session })).status, 200);
    assert.deepEqual(demandes, ["vps:7j", "vps:24h"]);
    assert.equal((await banc.demander("GET", "/maintenance/machines/autre/courbes", { session })).status, 404);
    assert.equal((await banc.demander("GET", "/maintenance/machines/autre/systeme", { session })).status, 404);
    const journal = await banc.demander("GET", "/maintenance/journaux/api?filtre=problemes", { session });
    assert.deepEqual(await journal.json(), { id: "api", filtre: "problemes", lignes: [] });
    assert.equal((await banc.demander("GET", "/maintenance/journaux/..%2F..%2Fetc%2Fpasswd", { session })).status, 404);
  } finally {
    await banc.fermer();
  }
});
