import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, beforeEach, test } from "node:test";

import { preparerPhotoAvis } from "../src/fonctions/avis/preparer-photo-avis.ts";
import { retirerMetadonneesJpeg } from "../src/fonctions/medias/retirer-metadonnees-jpeg.ts";
import { TAILLE_MAX_PHOTO_AVIS } from "../src/services/photos-avis-regles.ts";
import { FORME_PHOTO_AVIS } from "../src/services/stockage-photos-avis.ts";
import { creerBancPhotosAvis } from "./outils/creer-banc-photos-avis.ts";
import { avecDimensions, avecSegment, avecSegmentApp13, HEIC, PNG, segmentsJpeg } from "./outils/fabriquer-photos-avis.ts";

const PHOTO = readFileSync(new URL("./donnees/photo-avis-exif-position.jpg", import.meta.url));
const VIGNETTE = readFileSync(new URL("./donnees/photo-exif-position.jpg", import.meta.url));
const GPS = "GPS 43.6108,3.8767";
const ADOBE_PROPRE = Buffer.from([0xff, 0xee, 0x00, 0x0e, 0x41, 0x64, 0x6f, 0x62, 0x65, 0x00, 0x64, 0x00, 0x00, 0x00, 0x00, 0x01]);
const adobe = (transformation: number, enPlus = "") =>
  Buffer.concat([Buffer.from("Adobe", "latin1"), Buffer.from([0x00, 0x65, 0x80, 0x00, 0x00, 0x00, transformation]), Buffer.from(enPlus, "latin1")]);
const TEXTE = "Des crêpes dorées, un cidre frais, et le Capitaine qui chante.";
const JOUR = 24 * 3600_000;

let b: Awaited<ReturnType<typeof creerBancPhotosAvis>>;
before(async () => { b = await creerBancPhotosAvis(); });
after(() => b.fermer());
beforeEach(() => b.vider());

const envoyer = (jeton: string, octets: Uint8Array = PHOTO, type = "image/jpeg") => b.demander("POST", "/app/avis/photos", { jeton, octets, type });
const donnerAvis = (jeton: string, visiteId: number, photo: string | null) =>
  b.demander("POST", "/app/avis", { jeton, json: { visiteId, note: 5, texte: TEXTE, photo } });
const compter = (o: Buffer, motif: string | Buffer) => {
  let n = 0;
  for (let i = o.indexOf(motif); i >= 0; i = o.indexOf(motif, i + 1)) n += 1;
  return n;
};

test("envoi : 201 { ok, photo }, nom tiré au hasard, EXIF (position GPS), XMP, IPTC, Adobe bavard, JPG0 et commentaire retirés", async () => {
  const lea = await b.creerCompte();
  const brute = avecSegment(avecSegment(avecSegmentApp13(PHOTO, "position:iptc 43.6108,3.8767"), 0xee, adobe(1, GPS)), 0xf0, Buffer.from(GPS, "latin1"));
  assert.ok(segmentsJpeg(brute).includes(0xe1) && segmentsJpeg(brute).includes(0xed), "la photo d'essai a bien EXIF et IPTC");
  assert.equal(compter(brute, GPS), 2);
  assert.ok(compter(PHOTO, Buffer.from([0x88, 0x25])) > 0, "la photo d'essai a bien un pointeur GPS");
  const r = await envoyer(lea.jeton, brute);
  assert.equal(r.statut, 201, JSON.stringify(r.corps));
  assert.deepEqual(Object.keys(r.corps!), ["ok", "photo"]);
  assert.match(r.corps!.photo, FORME_PHOTO_AVIS);
  assert.equal(r.entetes.get("cache-control"), "private, no-store");
  const rangee = b.stockage.fichiers.get(r.corps!.photo)!;
  assert.deepEqual(rangee.fiche, { compteId: lea.id, deposeLe: new Date(b.banc.horloge) });
  for (const secret of ["position:", "Exif", "xmpmeta", "commentaire", "TelephoneDeLea", "Photoshop", "8BIM", GPS]) assert.equal(compter(rangee.octets!, secret), 0, secret);
  assert.deepEqual(segmentsJpeg(rangee.octets!).filter((m) => (m >= 0xe1 && m <= 0xef) || m >= 0xf0), [0xee]);
  assert.deepEqual(rangee.octets, Buffer.concat([PHOTO.subarray(0, 2), ADOBE_PROPRE, retirerMetadonneesJpeg(PHOTO)!.subarray(2)]));
  const deux = await envoyer(lea.jeton);
  assert.notEqual(deux.corps!.photo, r.corps!.photo);
});

test("Adobe (APP14) réécrit en ses 12 octets utiles, segments JPG et JPG0 à JPG13 retirés, image intacte", () => {
  const propre = retirerMetadonneesJpeg(PHOTO)!;
  const avecAdobe = (o: Buffer) => Buffer.concat([o.subarray(0, 2), ADOBE_PROPRE, o.subarray(2)]);
  assert.deepEqual(retirerMetadonneesJpeg(avecSegment(PHOTO, 0xee, adobe(1))), avecAdobe(propre), "Adobe standard : version et drapeaux remis à zéro");
  assert.deepEqual(retirerMetadonneesJpeg(avecSegment(PHOTO, 0xee, adobe(1, GPS))), avecAdobe(propre), "texte après les 12 octets : retiré");
  const transforme = retirerMetadonneesJpeg(avecSegment(PHOTO, 0xee, adobe(2)))!;
  assert.equal(transforme[17], 2, "la transformation des couleurs est gardée");
  for (const [contenu, cas] of [[adobe(7), "transformation inconnue"], [Buffer.from("Adobe\0d", "latin1"), "trop court"], [Buffer.from(`Ducky${GPS}`, "latin1"), "pas Adobe"]] as const) {
    assert.deepEqual(retirerMetadonneesJpeg(avecSegment(PHOTO, 0xee, contenu)), propre, cas);
  }
  for (const marqueur of [0xc8, 0xf0, 0xf7, 0xfd]) {
    assert.deepEqual(retirerMetadonneesJpeg(avecSegment(PHOTO, marqueur, Buffer.from(GPS, "latin1"))), propre, `FF ${marqueur.toString(16)}`);
  }
  assert.deepEqual(retirerMetadonneesJpeg(propre), propre, "rien d'autre ne bouge");
});

test("preparerPhotoAvis : 320 px au moins de petit côté, sinon pas de +10 pour une vignette", async () => {
  for (const [largeur, hauteur] of [[319, 2000], [2000, 319], [1, 1], [64, 48]]) {
    assert.deepEqual(await preparerPhotoAvis(avecDimensions(VIGNETTE, largeur, hauteur)), { ok: false, erreur: "media-invalide", champ: "dimensions" }, `${largeur} × ${hauteur}`);
  }
  for (const [largeur, hauteur] of [[320, 320], [4096, 320], [320, 4096]]) {
    const r = await preparerPhotoAvis(avecDimensions(VIGNETTE, largeur, hauteur));
    assert.deepEqual(r.ok && [r.largeur, r.hauteur], [largeur, hauteur], `${largeur} × ${hauteur}`);
  }
});

test("6 Mo pile : 201 (le remplissage après la fin de l'image est jeté) ; un octet de plus : 413", async () => {
  const lea = await b.creerCompte();
  const pile = Buffer.concat([PHOTO, Buffer.alloc(TAILLE_MAX_PHOTO_AVIS - PHOTO.length, 0x47)]);
  assert.equal(pile.length, 6 * 1024 * 1024);
  const r = await envoyer(lea.jeton, pile);
  assert.equal(r.statut, 201, JSON.stringify(r.corps));
  assert.deepEqual(b.stockage.fichiers.get(r.corps!.photo)!.octets, retirerMetadonneesJpeg(PHOTO));
  const trop = await envoyer(lea.jeton, Buffer.concat([pile, Buffer.from([0x47])]));
  assert.deepEqual([trop.statut, trop.corps], [413, { ok: false, erreur: "media-trop-lourd" }]);
  assert.deepEqual(await preparerPhotoAvis(Buffer.concat([pile, Buffer.from([0x47])])), { ok: false, erreur: "media-trop-lourd" });
  assert.equal(b.stockage.fichiers.size, 1);
});

test("preparerPhotoAvis : JPEG seulement, 6 Mo et 4 096 px au plus, fichier entier", async () => {
  assert.deepEqual(await preparerPhotoAvis(HEIC), { ok: false, erreur: "format-refuse" });
  assert.deepEqual(await preparerPhotoAvis(PNG), { ok: false, erreur: "format-refuse" });
  assert.deepEqual(await preparerPhotoAvis(Buffer.alloc(0)), { ok: false, erreur: "format-refuse" });
  const lourde = Buffer.concat([PHOTO.subarray(0, 4), Buffer.alloc(TAILLE_MAX_PHOTO_AVIS)]);
  assert.deepEqual(await preparerPhotoAvis(lourde), { ok: false, erreur: "media-trop-lourd" });
  assert.deepEqual(await preparerPhotoAvis(avecDimensions(PHOTO, 5000, 300)), { ok: false, erreur: "media-invalide", champ: "dimensions" });
  assert.deepEqual(await preparerPhotoAvis(PHOTO.subarray(0, PHOTO.length - 40)), { ok: false, erreur: "media-invalide", champ: "format" });
  const bonne = await preparerPhotoAvis(PHOTO);
  assert.deepEqual(bonne.ok && [bonne.largeur, bonne.hauteur], [640, 480]);
});

test("refus : type, taille, dimensions, fichier abîmé ; rien n'est écrit", async () => {
  const lea = await b.creerCompte();
  const cas: [Uint8Array, string, number, Record<string, unknown>][] = [
    [HEIC, "image/heic", 415, { ok: false, erreur: "format-refuse" }],
    [HEIC, "image/jpeg", 415, { ok: false, erreur: "format-refuse" }],
    [PNG, "image/png", 415, { ok: false, erreur: "format-refuse" }],
    [PHOTO, "application/octet-stream", 415, { ok: false, erreur: "format-refuse" }],
    [Buffer.concat([PHOTO.subarray(0, 4), Buffer.alloc(TAILLE_MAX_PHOTO_AVIS)]), "image/jpeg", 413, { ok: false, erreur: "media-trop-lourd" }],
    [avecDimensions(PHOTO, 300, 4097), "image/jpeg", 400, { ok: false, erreur: "media-invalide", champ: "dimensions" }],
    [avecDimensions(PHOTO, 400, 300), "image/jpeg", 400, { ok: false, erreur: "media-invalide", champ: "dimensions" }],
    [PHOTO.subarray(0, PHOTO.length - 40), "image/jpeg", 400, { ok: false, erreur: "media-invalide", champ: "format" }],
  ];
  for (const [octets, type, statut, corps] of cas) {
    const r = await envoyer(lea.jeton, octets, type);
    assert.deepEqual([r.statut, r.corps], [statut, corps], `${type} (${octets.length} octets)`);
  }
  const vide = await b.demander("POST", "/app/avis/photos", { jeton: lea.jeton, json: {} });
  assert.deepEqual([vide.statut, vide.corps], [415, { ok: false, erreur: "format-refuse" }]);
  assert.equal(b.stockage.fichiers.size, 0);
});

test("disque presque plein : 503 stockage-plein avec Retry-After", async () => {
  const lea = await b.creerCompte();
  b.stockage.reglerPartLibre(0.1);
  const r = await envoyer(lea.jeton);
  assert.deepEqual([r.statut, r.corps, r.entetes.get("retry-after")], [503, { ok: false, erreur: "stockage-plein" }, "3600"]);
  b.stockage.reglerPartLibre(1);
  assert.equal(b.stockage.fichiers.size, 0);
});

test("session obligatoire, compte limité refusé, 20 photos par heure et par compte", async () => {
  assert.equal((await b.demander("POST", "/app/avis/photos", { octets: PHOTO })).statut, 401);
  const limite = await b.creerCompte("Max");
  b.limites.add(limite.id);
  const refus = await envoyer(limite.jeton);
  assert.deepEqual([refus.statut, refus.corps], [403, { ok: false, erreur: "compte-limite", details: { jusqua: null } }]);
  assert.equal(b.stockage.fichiers.size, 0);

  const lea = await b.creerCompte();
  for (let i = 0; i < 20; i++) assert.equal((await envoyer(lea.jeton)).statut, 201, `envoi ${i + 1}`);
  const trop = await envoyer(lea.jeton);
  assert.deepEqual([trop.statut, trop.corps], [429, { ok: false, erreur: "trop-de-demandes" }]);
  assert.ok(Number(trop.entetes.get("retry-after")) > 0);
  const malo = await b.creerCompte("Malo");
  assert.equal((await envoyer(malo.jeton)).statut, 201, "la limite est par compte");
});

test("verifierPhoto : sa photo, déposée depuis moins de 24 h, encore libre ; faux sinon", async () => {
  const lea = await b.creerCompte();
  const malo = await b.creerCompte("Malo");
  const photo = (await envoyer(lea.jeton)).corps!.photo as string;
  assert.equal(await b.photos.verifier(photo, lea.id), true);
  assert.equal(await b.photos.verifier(photo, malo.id), false, "pas la sienne");
  assert.equal(await b.photos.verifier("8b0e7c1e-7a4b-4c1d-9e2f-3a4b5c6d7e8f.jpg", lea.id), false, "inconnue");
  for (const mauvais of ["../secret.jpg", photo.toUpperCase(), photo.replace(".jpg", ".json"), `${photo}/x`, ""]) {
    assert.equal(await b.photos.verifier(mauvais, lea.id), false, mauvais);
  }
  b.banc.horloge += 24 * 3600_000 - 1;
  assert.equal(await b.photos.verifier(photo, lea.id), true, "juste avant 24 h");
  b.banc.horloge += 1;
  assert.equal(await b.photos.verifier(photo, lea.id), false, "24 h passées");

  b.banc.horloge -= 24 * 3600_000;
  b.stockage.fichiers.get(photo)!.octets = null;
  assert.equal(await b.photos.verifier(photo, lea.id), false, "fiche sans photo");
});

test("avis avec photo : +10 points ; la même photo ne sert jamais deux fois, même en même temps", async () => {
  const lea = await b.creerCompte();
  const [v1, v2, v3] = [b.creerVisite(lea.id), b.creerVisite(lea.id), b.creerVisite(lea.id)];
  const photo = (await envoyer(lea.jeton)).corps!.photo as string;
  const r = await donnerAvis(lea.jeton, v1, photo);
  assert.deepEqual([r.statut, r.corps!.pointsGagnes, r.corps!.avis.photo], [201, 10, photo], JSON.stringify(r.corps));
  assert.equal(await b.photos.verifier(photo, lea.id), false, "déjà utilisée");
  const encore = await donnerAvis(lea.jeton, v2, photo);
  assert.deepEqual([encore.statut, encore.corps], [400, { ok: false, erreur: "avis-invalide", champ: "photo" }]);

  const neuve = (await envoyer(lea.jeton)).corps!.photo as string;
  const liberer = b.retenirCitations();
  const lectures = b.lecturesCitations.length;
  const premier = donnerAvis(lea.jeton, v2, neuve);
  await b.attendreLectures(lectures + 1);
  const second = await Promise.race([donnerAvis(lea.jeton, v3, neuve), new Promise<null>((fini) => setTimeout(() => fini(null), 2000))]);
  liberer();
  assert.deepEqual([second?.statut, second?.corps], [400, { ok: false, erreur: "avis-invalide", champ: "photo" }], "réservée par l'avis en cours");
  assert.equal((await premier).statut, 201);
  assert.equal(b.donnees.avis.filter((a) => a.photo === neuve).length, 1);
  assert.equal(await b.photos.verifier(neuve, lea.id), false);

  const malo = await b.creerCompte("Malo");
  const vMalo = b.creerVisite(malo.id);
  const volee = await donnerAvis(malo.jeton, vMalo, (await envoyer(lea.jeton)).corps!.photo);
  assert.deepEqual([volee.statut, volee.corps!.champ], [400, "photo"], "la photo d'un autre compte");
});

test("lecture publique : seulement la photo d'un avis visible chez un lieu publié, en cache 5 min", async () => {
  const lea = await b.creerCompte();
  const photo = (await envoyer(lea.jeton)).corps!.photo as string;
  const avant = await b.demander("GET", `/app/avis/photos/${photo}`);
  assert.deepEqual([avant.statut, avant.corps, avant.entetes.get("cache-control")], [404, { ok: false, erreur: "photo-inconnue" }, "no-store"]);
  assert.equal((await donnerAvis(lea.jeton, b.creerVisite(lea.id), photo)).statut, 201);

  const lue = await b.demander("GET", `/app/avis/photos/${photo}`);
  assert.equal(lue.statut, 200);
  assert.deepEqual(lue.octets, retirerMetadonneesJpeg(PHOTO));
  assert.deepEqual(
    ["content-type", "cache-control", "x-content-type-options", "content-disposition"].map((n) => lue.entetes.get(n)),
    ["image/jpeg", "public, max-age=300", "nosniff", "inline"],
  );

  const avis = b.donnees.avis.find((a) => a.photo === photo)!;
  avis.statut = "en-relecture";
  assert.equal((await b.demander("GET", `/app/avis/photos/${photo}`)).statut, 200, "en relecture : toujours visible");
  avis.statut = "masque";
  assert.equal((await b.demander("GET", `/app/avis/photos/${photo}`)).statut, 404, "masqué");
  avis.statut = "publie";
  b.donnees.lieux.get(1)!.publie = false;
  assert.equal((await b.demander("GET", `/app/avis/photos/${photo}`)).statut, 404, "lieu plus publié");
  b.donnees.lieux.get(1)!.publie = true;

  const lectures = b.lecturesCitations.length;
  for (const mauvais of ["..%2F..%2Fetc%2Fpasswd", "photo-1.jpg", photo.replace(".jpg", ".json"), photo.toUpperCase()]) {
    assert.equal((await b.demander("GET", `/app/avis/photos/${mauvais}`)).statut, 404, mauvais);
  }
  assert.equal(b.lecturesCitations.length, lectures, "un nom mal formé ne va jamais jusqu'à la base");
});

test("ménage : orpheline après 24 h, photo d'un avis effacé, avis masqué après le délai de contestation", async () => {
  const maintenant = new Date(b.banc.horloge);
  const ilYa = (ms: number) => new Date(maintenant.getTime() - ms);
  const deposer = async (age: number, compteId = 1) => {
    const photo = b.stockage.tirerNom();
    await b.stockage.ecrire(photo, Buffer.from([0xff, 0xd8, 0xff, 0xd9]), { compteId, deposeLe: ilYa(age) });
    return photo;
  };
  const citer = async (photo: string, statut: "publie" | "en-relecture" | "masque", age: number) =>
    (await b.donnees.depot.ecrire((t) => t.creerAvis({
      compteId: 1, lieuId: 1, visiteId: null, note: 4, texte: TEXTE, photo, signature: "Léa", statut, raisonRelecture: null, repasOffert: false, creeLe: ilYa(age),
    }))).id;
  const decider = (avisId: number, d: { traite: number; conteste?: number; reexamine?: number }) => b.decisions.push({
    avisId, statut: "retenu", traiteLe: ilYa(d.traite), contesteLe: d.conteste === undefined ? null : ilYa(d.conteste), reexamineLe: d.reexamine === undefined ? null : ilYa(d.reexamine),
  });

  const garder: string[] = [];
  const effacer: string[] = [];
  garder.push(await deposer(2 * 3600_000));
  garder.push(await deposer(24.5 * 3600_000));
  effacer.push(await deposer(26 * 3600_000));
  const publiee = await deposer(400 * JOUR);
  await citer(publiee, "publie", 400 * JOUR);
  garder.push(publiee);
  const enRelecture = await deposer(300 * JOUR);
  await citer(enRelecture, "en-relecture", 300 * JOUR);
  garder.push(enRelecture);
  effacer.push(await deposer(10 * JOUR));
  const masqueRecent = await deposer(30 * JOUR);
  decider(await citer(masqueRecent, "masque", 30 * JOUR), { traite: 10 * JOUR });
  garder.push(masqueRecent);
  const masqueAncien = await deposer(250 * JOUR);
  decider(await citer(masqueAncien, "masque", 250 * JOUR), { traite: 200 * JOUR });
  effacer.push(masqueAncien);
  const conteste = await deposer(250 * JOUR);
  decider(await citer(conteste, "masque", 250 * JOUR), { traite: 200 * JOUR, conteste: 190 * JOUR });
  garder.push(conteste);
  const reexamine = await deposer(250 * JOUR);
  decider(await citer(reexamine, "masque", 250 * JOUR), { traite: 200 * JOUR, conteste: 190 * JOUR, reexamine: 20 * JOUR });
  garder.push(reexamine);
  const sansDecisionAncien = await deposer(200 * JOUR);
  await citer(sansDecisionAncien, "masque", 200 * JOUR);
  effacer.push(sansDecisionAncien);
  const sansDecisionRecent = await deposer(20 * JOUR);
  await citer(sansDecisionRecent, "masque", 20 * JOUR);
  garder.push(sansDecisionRecent);
  const ficheSeule = await deposer(30 * 3600_000);
  b.stockage.fichiers.get(ficheSeule)!.octets = null;
  const photoSansFiche = await deposer(0);
  Object.assign(b.stockage.fichiers.get(photoSansFiche)!, { fiche: null, modifieLe: ilYa(3 * JOUR) });
  effacer.push(photoSansFiche);

  assert.equal(await b.photos.menager(maintenant), effacer.length);
  assert.deepEqual([...b.stockage.fichiers.keys()].sort(), [...garder].sort());
  assert.equal(await b.photos.menager(maintenant), 0, "un second passage ne trouve plus rien");
});

test("ménage par paquets : 450 orphelines effacées en trois passages", async () => {
  for (let i = 0; i < 450; i++) await b.stockage.ecrire(b.stockage.tirerNom(), Buffer.from("x"), { compteId: 1, deposeLe: new Date(b.banc.horloge - 2 * JOUR) });
  b.lecturesCitations.length = 0;
  assert.equal(await b.photos.menager(new Date(b.banc.horloge)), 450);
  assert.deepEqual(b.lecturesCitations.map((l) => l.length), [200, 200, 50]);
  assert.equal(b.stockage.fichiers.size, 0);
});
