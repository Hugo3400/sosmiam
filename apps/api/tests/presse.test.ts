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
const { creerLienPresse, lireLienPresse, listerPresse, trouverFichierPresse } = await import("../src/services/gestion/presse.ts");
const banc = await creerBancGestion({ listerPresse, trouverFichierPresse, creerLienPresse, lireLienPresse } as never);
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

test("canaux : ceux de l'index d'abord, sinon déduits du nom, des dimensions et du format", async () => {
  const { deduireCanauxPresse } = await import("../src/fonctions/presse/deduire-canaux-presse.ts");
  const f = (nom: string, format: string, dimensions: string | null = null, description = "") => ({ nom, format, dimensions, description });
  assert.deepEqual(deduireCanauxPresse(f("carrousel-1.png", "PNG", "1080 × 1350 px"), "reseaux"), ["instagram"]);
  assert.deepEqual(deduireCanauxPresse(f("story.png", "PNG", "1080 × 1920 px"), "reseaux"), ["instagram", "tiktok"]);
  assert.deepEqual(deduireCanauxPresse(f("clip.mp4", "MP4", "30 s"), "videos"), ["instagram", "tiktok"]);
  assert.deepEqual(deduireCanauxPresse(f("ios-iphone-01.jpg", "JPG", "1290 × 2796 px"), "stores"), ["ios"]);
  assert.deepEqual(deduireCanauxPresse(f("android-banniere.png", "PNG", null, "Play Store · Bannière"), "stores"), ["android"]);
  assert.deepEqual(deduireCanauxPresse(f("affiche.pdf", "PDF"), "affiches"), ["impression"]);
  assert.deepEqual(deduireCanauxPresse(f("communique.md", "MD"), "textes"), ["textes"]);
  assert.deepEqual(deduireCanauxPresse({ ...f("logo.png", "PNG"), canaux: ["android", "inconnu", "ios"] }, "kit-de-marque"), ["ios", "android", "marque"]);
  // Toujours déduits, même quand l'index donne ses canaux (y compris [])
  assert.deepEqual(deduireCanauxPresse({ ...f("SOSMiam_facebook_couverture_1640x624.png", "PNG", "1640 × 624 px"), canaux: [] }, "kit-de-marque"), ["facebook", "marque"]);
  assert.deepEqual(deduireCanauxPresse({ ...f("banniere_1500x500.png", "PNG", "1500 × 500 px"), canaux: [] }, "kit-de-marque"), ["x", "marque"]);
  assert.deepEqual(deduireCanauxPresse({ ...f("SOSMiam_favicon_32.png", "PNG", "32 × 32 px"), canaux: [] }, "kit-de-marque"), ["web", "marque"]);
  assert.deepEqual(deduireCanauxPresse({ ...f("SOSMiam_jingle.mp3", "MP3"), canaux: [] }, "sons"), ["sons"]);
  assert.deepEqual(deduireCanauxPresse({ ...f("SOSMiam_ambassadeurs_apercu.png", "PNG", "2148 × 1150 px"), canaux: [] }, "campagne"), ["presentation"]);
  assert.deepEqual(deduireCanauxPresse(f("mascotte-clin.svg", "SVG"), "kit-media"), ["instagram", "tiktok", "impression", "marque"]);
});
