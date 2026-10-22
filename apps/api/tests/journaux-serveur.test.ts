import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";

import {
  analyserLigne, compterErreursRecentes, creerJournauxServeur, lireFinFichier, listerSourcesConnues, masquerLigne, type SourceJournal,
} from "../src/services/gestion/journaux-serveur.ts";

const dossiers: string[] = [];
after(async () => {
  await Promise.all(dossiers.map((dossier) => rm(dossier, { recursive: true, force: true })));
});

test("les e-mails, IP, jetons et paramètres d'adresse sont masqués avant de quitter le serveur", () => {
  assert.equal(masquerLigne("lien envoyé à jeanne.dupont@gmail.com"), "lien envoyé à j•••@gmail.com");
  assert.equal(masquerLigne("client: 162.158.12.34, server: sosmiam.fr"), "client: 162.158.•••, server: sosmiam.fr");
  assert.equal(masquerLigne("API prête sur http://127.0.0.1:5192"), "API prête sur http://127.0.0.1:5192");
  assert.equal(masquerLigne("GET /nouveau-mot-de-passe?jeton=abc 200"), "GET /nouveau-mot-de-passe?••• 200");
  assert.equal(masquerLigne("Authorization: Bearer eyJhbGciOi.zzz"), "Authorization: Bearer •••");
  assert.equal(masquerLigne("session 3f9a1c0e8b7d6a5f4e3d2c1b0a9f8e7d6c5b4a39 ouverte"), "session ••• ouverte");
  assert.equal(masquerLigne("de 2a01:cb19:8b5:4200:1d2e:aa1:bb2:cc3"), "de •••");
  assert.equal(masquerLigne("client: 2a06:98c0:3600::2, server"), "client: •••, server");
  assert.equal(masquerLigne("à 23:50:29, ligne index.js:45:11"), "à 23:50:29, ligne index.js:45:11");
  assert.equal(masquerLigne("Le Capitaine est là ? Oui."), "Le Capitaine est là ? Oui.");
});

test("une ligne nginx donne son heure et sa gravité, une ligne pm2 son niveau", () => {
  const nginx = analyserLigne("2026/10/21 23:50:29 [error] 1234#1234: *67 connect() failed (111: Connection refused), client: 162.158.1.2", { flux: "erreurs", sorte: "nginx" });
  assert.equal(nginx?.niveau, "erreur");
  assert.equal(nginx?.heure, new Date(2026, 9, 21, 23, 50, 29).toISOString());
  assert.equal(nginx?.texte, "connect() failed (111: Connection refused), client: 162.158.•••");
  assert.equal(analyserLigne("2026/10/22 00:14:22 [warn] 9#9: an upstream response is buffered", { flux: "erreurs", sorte: "nginx" })?.niveau, "avert");
  assert.equal(analyserLigne("HEAD /mentions-legales 200 - 2.257 ms", { flux: "sortie", sorte: "pm2" })?.niveau, "info");
  assert.equal(analyserLigne("GET /lieu/introuvable 404 - 3.1 ms", { flux: "sortie", sorte: "pm2" })?.niveau, "avert");
  assert.equal(analyserLigne("GET / 502 - 3.1 ms", { flux: "sortie", sorte: "pm2" })?.niveau, "erreur");
  const horodatee = analyserLigne("2026-10-22T08:55:01: Comptes : envoi impossible", { flux: "erreurs", sorte: "pm2" });
  assert.equal(horodatee?.niveau, "erreur");
  assert.equal(horodatee?.texte, "Comptes : envoi impossible");
  assert.ok(horodatee?.heure);
  assert.equal(analyserLigne("(node:123) ExperimentalWarning: Type Stripping", { flux: "erreurs", sorte: "pm2" })?.niveau, "avert");
  assert.equal(analyserLigne("   ", { flux: "sortie", sorte: "pm2" }), null);
  assert.equal(analyserLigne("mot ".repeat(225), { flux: "sortie", sorte: "pm2" })?.texte.length, 601);
});

test("seule la fin d'un gros fichier est lue, sans la ligne coupée", async () => {
  const dossier = await mkdtemp(join(tmpdir(), "sos-miam-journaux-"));
  dossiers.push(dossier);
  const chemin = join(dossier, "gros.log");
  await writeFile(chemin, Array.from({ length: 2000 }, (_, rang) => `ligne ${rang}`).join("\n"));
  const lignes = await lireFinFichier(chemin, 100);
  assert.ok(lignes && lignes.length < 20);
  assert.equal(lignes?.at(-1), "ligne 1999");
  assert.ok(lignes?.every((ligne) => /^ligne \d+$/.test(ligne)));
  assert.equal(await lireFinFichier(join(dossier, "absent.log")), null);
});

test("les journaux ne lisent que les sources connues, filtrent et comptent les erreurs de la dernière heure", async () => {
  const dossier = await mkdtemp(join(tmpdir(), "sos-miam-journaux-"));
  dossiers.push(dossier);
  await writeFile(join(dossier, "a-out.log"), "API SOS Miam prête\nGET / 200 - 1 ms\n");
  await writeFile(join(dossier, "a-error.log"), "Sorties : Error | at pg-pool\n");
  await writeFile(join(dossier, "n.log"), "2026/10/22 09:10:00 [error] 1#1: upstream timed out\n2026/10/22 07:00:00 [error] 1#1: plus vieux\n2026/10/22 09:20:00 [warn] 1#1: attention\n");
  const sources: SourceJournal[] = [
    { id: "a", nom: "A", fichiers: [{ chemin: join(dossier, "a-out.log"), flux: "sortie", sorte: "pm2" }, { chemin: join(dossier, "a-error.log"), flux: "erreurs", sorte: "pm2" }] },
    { id: "n", nom: "N", fichiers: [{ chemin: join(dossier, "n.log"), flux: "erreurs", sorte: "nginx" }] },
    { id: "vide", nom: "Vide", fichiers: [{ chemin: join(dossier, "absent.log"), flux: "sortie", sorte: "pm2" }] },
  ];
  const journaux = creerJournauxServeur({ sources: () => sources, horloge: () => new Date(2026, 9, 22, 9, 30).getTime() });
  const liste = await journaux.listerSources();
  assert.deepEqual(liste.sources, [
    { id: "a", nom: "A", existe: true, horodate: false, erreursRecentes: null },
    { id: "n", nom: "N", existe: true, horodate: true, erreursRecentes: 1 },
    { id: "vide", nom: "Vide", existe: false, horodate: false, erreursRecentes: 0 },
  ]);
  const tout = await journaux.lireJournal("a", "tout");
  assert.deepEqual(tout?.lignes.map((ligne) => [ligne.flux, ligne.niveau, ligne.texte]), [
    ["sortie", "info", "API SOS Miam prête"],
    ["sortie", "info", "GET / 200 - 1 ms"],
    ["erreurs", "erreur", "Sorties : Error | at pg-pool"],
  ]);
  assert.equal((await journaux.lireJournal("a", "problemes"))?.lignes.length, 1);
  const nginx = await journaux.lireJournal("n", "tout");
  assert.deepEqual(nginx?.lignes.map((ligne) => ligne.texte), ["plus vieux", "upstream timed out", "attention"]);
  assert.equal(await journaux.lireJournal("../../etc/passwd", "tout"), null);
  assert.equal(compterErreursRecentes([], Date.now()), 0);
});

test("la liste des sources est fermée : seulement les programmes de SOS Miam et nginx", () => {
  const sources = listerSourcesConnues();
  assert.deepEqual(sources.map((source) => source.id), ["api", "site", "bot-discord", "app-dev", "site-dev", "nginx"]);
  for (const source of sources) {
    for (const fichier of source.fichiers) assert.match(fichier.chemin, /(sos-miam-[a-z-]+-(out|error)\.log|sosmiam(-api)?\.error\.log)$/);
  }
});
