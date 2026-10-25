import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, test } from "node:test";

import express from "express";

import { BANNIERE_LIEU, FORME_NOM_IMAGE_LIEU, LOGO_LIEU } from "../../../packages/commun/src/regles/images-lieu.ts";
import { preparerImageLieu } from "../src/fonctions/lieux/preparer-image-lieu.ts";
import { presenterLieuApp } from "../src/fonctions/lieux/presenter-lieu-app.ts";
import { retirerMetadonneesJpeg } from "../src/fonctions/medias/retirer-metadonnees-jpeg.ts";
import { creerRoutesContenuApp } from "../src/routes/contenu-app.ts";
import { creerRoutesImagesLieu } from "../src/routes/images-lieu.ts";
import { creerImagesLieu } from "../src/services/images-lieu.ts";
import { creerDepotImagesLieuEnMemoire } from "../src/services/images-lieu-en-memoire.ts";
import type { RoleRattachement } from "../src/services/pro-regles.ts";
import { creerStockagesImagesLieuEnMemoire } from "../src/services/stockage-images-lieu.ts";
import { avecDimensions } from "./outils/fabriquer-photos-avis.ts";
import { fabriquerBlocPng, fabriquerPng } from "./outils/fabriquer-png.ts";

const PHOTO = readFileSync(new URL("./donnees/photo-avis-exif-position.jpg", import.meta.url));
const BANNIERE = avecDimensions(PHOTO, BANNIERE_LIEU.largeur, BANNIERE_LIEU.hauteur);
const LOGO = fabriquerPng({ largeur: 512, hauteur: 512, couleur: 6, avant: [fabriquerBlocPng("tEXt", Buffer.from("Author\0Secret du lieu", "latin1"))] });
const nettoyer = async (octets: Uint8Array) => retirerMetadonneesJpeg(octets);
const contient = (octets: Uint8Array, texte: string) => Buffer.from(octets).includes(Buffer.from(texte, "latin1"));

const DEBUT = Date.parse("2026-10-25T10:00:00Z");
let horloge = DEBUT;
const roles = new Map<string, RoleRattachement>();
let depot = creerDepotImagesLieuEnMemoire();
let stockages = creerStockagesImagesLieuEnMemoire({ horloge: () => horloge });
let images = creerImagesLieu({ stockages, depot: depot.depot, lireRole: async (c, l) => roles.get(`${c}:${l}`) ?? null, horloge: () => horloge }, nettoyer);

function remettreAZero() {
  horloge = DEBUT;
  roles.clear();
  roles.set("7:1", "gerant");
  roles.set("8:1", "equipe");
  depot = creerDepotImagesLieuEnMemoire();
  depot.lieux.set(1, { banniere: null, logo: null, statut: "publie", imagesMajLe: null });
  depot.lieux.set(2, { banniere: null, logo: null, statut: "brouillon", imagesMajLe: null });
  stockages = creerStockagesImagesLieuEnMemoire({ horloge: () => horloge });
  images = creerImagesLieu({ stockages, depot: depot.depot, lireRole: async (c, l) => roles.get(`${c}:${l}`) ?? null, horloge: () => horloge }, nettoyer);
}
beforeEach(remettreAZero);

const nomDe = (adresse: string) => adresse.split("/").pop()!;

test("préparation : bannière JPEG de 1600 × 500 nettoyée de sa position, logo PNG de 512 × 512 nettoyé de ses textes", async () => {
  assert.equal(contient(BANNIERE, "position:"), true);
  const banniere = await preparerImageLieu("banniere", BANNIERE, nettoyer);
  assert.equal(banniere.ok, true);
  assert.equal(banniere.ok && contient(banniere.octets, "position:"), false);
  const logo = await preparerImageLieu("logo", LOGO, nettoyer);
  assert.equal(logo.ok, true);
  assert.equal(logo.ok && contient(logo.octets, "Secret du lieu"), false);
});

test("préparation : mauvaises dimensions, mauvais format, trop lourd ou vide refusés", async () => {
  const cas: [Parameters<typeof preparerImageLieu>[0], Buffer, string][] = [
    ["banniere", avecDimensions(PHOTO, 1600, 501), "image-lieu-invalide"],
    ["banniere", avecDimensions(PHOTO, 800, 250), "image-lieu-invalide"],
    ["banniere", LOGO, "image-lieu-invalide"],
    ["banniere", Buffer.alloc(BANNIERE_LIEU.poidsMax + 1, 0xff), "image-lieu-trop-lourde"],
    ["banniere", Buffer.alloc(0), "image-lieu-invalide"],
    ["logo", fabriquerPng({ largeur: 512, hauteur: 511 }), "image-lieu-invalide"],
    ["logo", BANNIERE, "image-lieu-invalide"],
    ["logo", fabriquerPng({ largeur: 512, hauteur: 512, idat: Buffer.from("pas du deflate") }), "image-lieu-invalide"],
    ["logo", Buffer.alloc(LOGO_LIEU.poidsMax + 1), "image-lieu-trop-lourde"],
  ];
  for (const [quelle, octets, erreur] of cas) assert.deepEqual(await preparerImageLieu(quelle, octets, nettoyer), { ok: false, erreur }, `${quelle} ${erreur}`);
});

test("envoi : le gérant pose la bannière et le logo ; l'ancienne image est effacée quand elle est remplacée", async () => {
  const premiere = await images.envoyer(7, 1, "banniere", BANNIERE);
  assert.equal(premiere.ok, true);
  const nom1 = nomDe(premiere.ok ? premiere.adresse : "");
  assert.match(nom1, FORME_NOM_IMAGE_LIEU);
  assert.ok(nom1.endsWith(".jpg"));
  assert.equal(premiere.ok && premiere.adresse, `/app/lieux/images/${nom1}`);
  assert.equal(depot.lieux.get(1)!.banniere, nom1);
  assert.equal(depot.lieux.get(1)!.imagesMajLe?.getTime(), DEBUT);
  horloge += 60_000;
  const seconde = await images.envoyer(7, 1, "banniere", BANNIERE);
  const nom2 = nomDe(seconde.ok ? seconde.adresse : "");
  assert.notEqual(nom2, nom1);
  assert.equal(await stockages.banniere.existe(nom1), false);
  assert.equal(await stockages.banniere.existe(nom2), true);
  const logo = await images.envoyer(7, 1, "logo", LOGO);
  const nomLogo = nomDe(logo.ok ? logo.adresse : "");
  assert.ok(nomLogo.endsWith(".png"));
  assert.deepEqual([depot.lieux.get(1)!.banniere, depot.lieux.get(1)!.logo], [nom2, nomLogo]);
});

test("envoi : réservé au gérant ; lieu inconnu ou disque plein : rien n'est gardé", async () => {
  assert.deepEqual(await images.envoyer(8, 1, "banniere", BANNIERE), { ok: false, erreur: "reserve-au-gerant" });
  assert.deepEqual(await images.envoyer(9, 1, "logo", LOGO), { ok: false, erreur: "role-requis" });
  roles.set("7:404", "gerant");
  assert.deepEqual(await images.envoyer(7, 404, "banniere", BANNIERE), { ok: false, erreur: "lieu-inconnu" });
  assert.equal(stockages.banniere.fichiers.size, 0);
  stockages.logo.reglerPartLibre(0.05);
  assert.deepEqual(await images.envoyer(7, 1, "logo", LOGO), { ok: false, erreur: "stockage-plein" });
  assert.equal(stockages.logo.fichiers.size, 0);
  assert.deepEqual(await images.envoyer(7, 1, "banniere", avecDimensions(PHOTO, 10, 10)), { ok: false, erreur: "image-lieu-invalide" });
  assert.deepEqual([depot.lieux.get(1)!.banniere, depot.lieux.get(1)!.logo], [null, null]);
});

test("retrait : par le gérant ou par l'équipe de SOS Miam ; le fichier part avec", async () => {
  const r = await images.envoyer(7, 1, "logo", LOGO);
  const nom = nomDe(r.ok ? r.adresse : "");
  assert.deepEqual(await images.retirer(8, 1, "logo"), { ok: false, erreur: "reserve-au-gerant" });
  assert.deepEqual(await images.retirer(7, 1, "logo"), { ok: true, retiree: true });
  assert.equal(await stockages.logo.existe(nom), false);
  assert.equal(depot.lieux.get(1)!.logo, null);
  assert.deepEqual(await images.retirer(7, 1, "logo"), { ok: true, retiree: false });
  await images.envoyer(7, 1, "banniere", BANNIERE);
  assert.deepEqual(await images.retirerParEquipe(1, "banniere"), { ok: true, retiree: true });
  assert.equal(stockages.banniere.fichiers.size, 0);
  assert.deepEqual(await images.retirerParEquipe(404, "banniere"), { ok: false, erreur: "lieu-inconnu" });
});

test("lecture publique : seulement une image citée par un lieu publié, avec son type", async () => {
  const banniere = await images.envoyer(7, 1, "banniere", BANNIERE);
  const logo = await images.envoyer(7, 1, "logo", LOGO);
  const lue = await images.lirePublique(nomDe(banniere.ok ? banniere.adresse : ""));
  assert.equal(lue?.type, "image/jpeg");
  assert.equal((await images.lirePublique(nomDe(logo.ok ? logo.adresse : "")))?.type, "image/png");
  depot.lieux.set(1, { ...depot.lieux.get(1)!, statut: "masque" });
  assert.equal(await images.lirePublique(nomDe(logo.ok ? logo.adresse : "")), null);
  for (const nom of ["../secret.jpg", "x.jpg", "11111111-1111-4111-8111-111111111111.gif", "11111111-1111-4111-8111-111111111111.jpg"]) assert.equal(await images.lirePublique(nom), null, nom);
});

test("ménage : les images envoyées puis jamais citées partent après 24 h, celles des lieux restent", async () => {
  const gardee = await images.envoyer(7, 1, "banniere", BANNIERE);
  const orpheline = stockages.logo.tirerNom();
  await stockages.logo.ecrire(orpheline, LOGO, { compteId: 7, deposeLe: new Date(DEBUT) });
  assert.equal(await images.menager(new Date(DEBUT + 3600_000)), 0);
  assert.equal(await images.menager(new Date(DEBUT + 25 * 3600_000)), 1);
  assert.equal(await stockages.logo.existe(orpheline), false);
  assert.equal(await stockages.banniere.existe(nomDe(gardee.ok ? gardee.adresse : "")), true);
});

const application = express();
application.use((requete, reponse, suite) => {
  const compte = Number(requete.get("X-Compte-Essai"));
  if (compte) reponse.locals.compte = { id: compte };
  suite();
});
application.use("/pro/comptoir", creerRoutesImagesLieu({ envoyer: (...a) => images.envoyer(...a), retirer: (...a) => images.retirer(...a), lirePublique: (n) => images.lirePublique(n) }));
application.use("/app", creerRoutesContenuApp({ images: { envoyer: (...a) => images.envoyer(...a), retirer: (...a) => images.retirer(...a), lirePublique: (n) => images.lirePublique(n) }, dossierMedias: "/nulle-part" }));
const serveur = application.listen(0, "127.0.0.1");
let adresse = "";
before(() => new Promise<void>((pret) => serveur.once("listening", () => {
  adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  pret();
})));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));

async function envoyer(methode: string, chemin: string, corps: Buffer | null, type: string, compte = 7) {
  const r = await fetch(`${adresse}${chemin}`, { method: methode, headers: { "Content-Type": type, "X-Compte-Essai": String(compte), "X-IP-Visiteur": `v-${Math.random()}` }, body: corps ?? undefined });
  return { statut: r.status, corps: (await r.json()) as Record<string, unknown>, entetes: r.headers };
}

test("routes : PUT et DELETE de la bannière et du logo, refus en codes ; la lecture publique se met en cache pour toujours", async () => {
  const banniere = await envoyer("PUT", "/pro/comptoir/lieux/1/banniere", BANNIERE, "image/jpeg");
  assert.equal(banniere.statut, 200);
  const chemin = String(banniere.corps.adresse);
  assert.match(chemin, /^\/app\/lieux\/images\/[0-9a-f-]+\.jpg$/);
  const lue = await fetch(`${adresse}${chemin}`, { headers: { "X-IP-Visiteur": "v-lecture" } });
  assert.equal(lue.status, 200);
  assert.deepEqual([lue.headers.get("content-type"), lue.headers.get("cache-control"), lue.headers.get("x-content-type-options")], ["image/jpeg", "public, max-age=31536000, immutable", "nosniff"]);
  assert.equal(contient(Buffer.from(await lue.arrayBuffer()), "position:"), false);
  const logo = await envoyer("PUT", "/pro/comptoir/lieux/1/logo", LOGO, "image/png");
  assert.equal(logo.statut, 200);
  assert.deepEqual([(await envoyer("PUT", "/pro/comptoir/lieux/1/logo", LOGO, "image/jpeg")).statut, (await envoyer("PUT", "/pro/comptoir/lieux/1/logo", LOGO, "image/jpeg")).corps.erreur], [400, "image-lieu-invalide"]);
  const lourd = await envoyer("PUT", "/pro/comptoir/lieux/1/banniere", Buffer.alloc(BANNIERE_LIEU.poidsMax + 10, 0xff), "image/jpeg");
  assert.deepEqual([lourd.statut, lourd.corps.erreur], [413, "image-lieu-trop-lourde"]);
  const equipe = await envoyer("PUT", "/pro/comptoir/lieux/1/banniere", BANNIERE, "image/jpeg", 8);
  assert.deepEqual([equipe.statut, equipe.corps.erreur], [403, "reserve-au-gerant"]);
  const inconnu = await envoyer("PUT", "/pro/comptoir/lieux/abc/banniere", BANNIERE, "image/jpeg");
  assert.deepEqual([inconnu.statut, inconnu.corps.erreur], [404, "lieu-inconnu"]);
  const retrait = await envoyer("DELETE", "/pro/comptoir/lieux/1/banniere", null, "application/json");
  assert.deepEqual([retrait.statut, retrait.corps], [200, { ok: true }]);
  const partie = await fetch(`${adresse}${chemin}`, { headers: { "X-IP-Visiteur": "v-lecture-2" } });
  assert.deepEqual([partie.status, partie.headers.get("cache-control")], [404, "no-store"]);
});

test("lieux de l'app : bannière et logo seulement pour un lieu vérifié, en adresse relative, jamais un nom de mauvaise forme", () => {
  const nom = "11111111-1111-4111-8111-111111111111";
  const ligne = {
    id: 1, nom: "Chez Léa", type: "resto", emoji: "🍝", info: "Trattoria", texte: "Des pâtes.", quartier: "Écusson", ville: "Montpellier",
    latitude: 43.61, longitude: 3.877, prix: "€€", prixMoyen: 18, couleurs: ["#FFD60A", "#FF7A00"], horaires: "", ouverture: [], plat: "",
    tags: [], envies: [], reservable: false, telephone: null, siteWeb: null, instagram: null, animaux: null, accessible: null, terrasse: null,
    wifi: null, enfants: null, parking: null, paiements: [], reservation: null, decouvertPar: null, rattachementsValides: 1, rescousses: 0,
    sos: null, alerte: null, alerteJusqua: null, publieLe: null, banniere: `${nom}.jpg`, logo: `${nom}.png`,
  };
  const verifie = presenterLieuApp(ligne, new Date(DEBUT));
  assert.deepEqual([verifie.banniere, verifie.logo], [`/app/lieux/images/${nom}.jpg`, `/app/lieux/images/${nom}.png`]);
  const pasVerifie = presenterLieuApp({ ...ligne, rattachementsValides: 0 }, new Date(DEBUT));
  assert.deepEqual(["banniere" in pasVerifie, "logo" in pasVerifie], [false, false]);
  const sansImage = presenterLieuApp({ ...ligne, banniere: null, logo: "../x.png" }, new Date(DEBUT));
  assert.deepEqual(["banniere" in sansImage, "logo" in sansImage], [false, false]);
});
