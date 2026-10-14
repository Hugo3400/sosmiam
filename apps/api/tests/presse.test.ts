// Tests de l'Espace presse : liste lue dans presse/index.json et les kits du site (dossiers d'essai), téléchargement d'un
// fichier listé seulement (jamais un chemin libre, ni « ../ » glissé dans l'index).
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";

import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

const dossier = mkdtempSync(join(tmpdir(), "presse-"));
mkdirSync(join(dossier, "affiches"));
mkdirSync(join(dossier, "apercus"));
writeFileSync(join(dossier, "affiches", "affiche.png"), "PNG");
writeFileSync(join(dossier, "affiches", "affiches.zip"), "ZIP");
writeFileSync(join(dossier, "apercus", "affiche.png"), "mini");
writeFileSync(join(dossier, "secret.txt"), "jamais");
writeFileSync(join(dossier, "index.json"), JSON.stringify({
  genere: "2026-10-14",
  familles: [{
    id: "affiches", titre: "Affiches", zip: "affiches/affiches.zip",
    fichiers: [
      { nom: "affiche.png", chemin: "affiches/affiche.png", format: "PNG", taille: "2382 × 3369 px", description: "Sauve une table", apercu: "apercus/affiche.png" },
      { nom: "evasion", chemin: "../../etc/passwd", format: "PNG" },
      { nom: "absent.png", chemin: "affiches/absent.png", format: "PNG" },
    ],
  }],
}));
process.env.DOSSIER_PRESSE = dossier;
const { listerPresse, trouverFichierPresse } = await import("../src/services/gestion/presse.ts");
const banc = await creerBancGestion({ listerPresse, trouverFichierPresse } as never);
let session = "";
before(async () => void (session = await banc.ouvrirSession()));
after(() => banc.fermer());

test("liste : les fichiers de l'index qui existent, jamais un chemin qui sort du dossier ; les kits du site ensuite", async () => {
  const { genere, familles } = await listerPresse();
  assert.equal(genere, "2026-10-14");
  const affiches = familles.find((f) => f.id === "affiches");
  assert.deepEqual(affiches?.fichiers.map((f) => [f.nom, f.dimensions, f.octets, f.apercu !== null]), [["affiche.png", "2382 × 3369 px", 3, true]]);
  assert.equal(affiches?.zip?.nom, "affiches.zip");
  assert.ok(familles.some((f) => f.source === "site"), "les kits médias du site");
});

test("téléchargement : un identifiant listé donne le fichier en pièce jointe ; inconnu ou mal formé : 404", async () => {
  const fichier = (await listerPresse()).familles[0]!.fichiers[0]!;
  const reponse = await banc.demander("GET", `/presse/fichiers/${fichier.id}`, { session });
  assert.equal(reponse.status, 200);
  assert.equal(await reponse.text(), "PNG");
  assert.equal(reponse.headers.get("content-disposition"), "attachment; filename*=UTF-8''affiche.png");
  assert.equal((await banc.demander("GET", "/presse/fichiers/AAAAAAAAAAAAAAAA", { session })).status, 404);
  assert.equal((await banc.demander("GET", "/presse/fichiers/..%2Fsecret.txt", { session })).status, 404);
});

test("gros fichier : un lien de 10 minutes, sans signature, pour le navigateur ; jeton inconnu : 404", async () => {
  const fichier = (await listerPresse()).familles[0]!.fichiers[0]!;
  const reponse = await banc.demander("POST", `/presse/fichiers/${fichier.id}/lien`, { session });
  const { lien } = (await reponse.json()) as { lien: string };
  assert.match(lien, /^https:\/\/sosmiam\.fr\/api-gestion\/presse\/telecharger\/[\w-]{32}$/);
  const chemin = new URL(lien).pathname.replace("/api-gestion", "");
  const direct = await fetch(`${banc.adresse}${chemin}`);
  assert.equal(direct.status, 200);
  assert.equal(await direct.text(), "PNG");
  assert.equal((await fetch(`${banc.adresse}/presse/telecharger/${"x".repeat(32)}`)).status, 404);
  assert.equal((await banc.demander("POST", "/presse/fichiers/AAAAAAAAAAAAAAAA/lien", { session })).status, 404);
});
