import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { lireOrientationJpeg } from "../src/fonctions/medias/lire-orientation-jpeg.ts";
import { listerBoitesMp4 } from "../src/fonctions/medias/lister-boites-mp4.ts";
import { nettoyerVideoMp4 } from "../src/fonctions/medias/nettoyer-video-mp4.ts";
import { retirerMetadonneesJpeg } from "../src/fonctions/medias/retirer-metadonnees-jpeg.ts";
import { preparerMediaPublication } from "../src/fonctions/publications/preparer-media-publication.ts";
import { FORMATS } from "../src/services/gestion/formats-medias.ts";
import { fabriquerPng } from "./outils/fabriquer-png.ts";
import { avecSegment } from "./outils/fabriquer-photos-avis.ts";
import { DATE_VIDEO, fabriquerVideoMp4, IMAGE_VIDEO, POSITION_VIDEO, SON_VIDEO } from "./outils/fabriquer-video-mp4.ts";

const PHOTO = readFileSync(new URL("./donnees/photo-avis-exif-position.jpg", import.meta.url));
const nettoyerSurPlace = async (octets: Uint8Array) => retirerMetadonneesJpeg(octets);
const contient = (octets: Buffer, texte: string) => octets.includes(Buffer.from(texte, "latin1"));
const datesRestantes = (octets: Buffer) => {
  const motif = Buffer.alloc(4);
  motif.writeUInt32BE(DATE_VIDEO);
  return octets.includes(motif);
};

function exifAvecOrientation(orientation: number, petit: boolean) {
  const tiff = Buffer.alloc(8 + 2 + 2 * 12 + 4 + 40);
  const u16 = (v: number, i: number) => (petit ? tiff.writeUInt16LE(v, i) : tiff.writeUInt16BE(v, i));
  const u32 = (v: number, i: number) => (petit ? tiff.writeUInt32LE(v, i) : tiff.writeUInt32BE(v, i));
  tiff.write(petit ? "II" : "MM", 0, "latin1");
  u16(42, 2);
  u32(8, 4);
  u16(2, 8);
  u16(0x010f, 10); u16(2, 12); u32(6, 14); u32(38, 18);
  u16(0x0112, 22); u16(3, 24); u32(1, 26); u16(orientation, 30);
  tiff.write("Apple GPS 43.6108,3.8767", 38, "latin1");
  return Buffer.concat([Buffer.from("Exif\0\0", "latin1"), tiff]);
}

test("vidéo : position, dates, blocs vides et piste GPS effacés ; image et son intacts, même taille", () => {
  for (const options of [{}, { large: true }, { fixe: true }]) {
    const { octets, image, son } = fabriquerVideoMp4(options);
    assert.ok(contient(octets, POSITION_VIDEO) && datesRestantes(octets));
    const propre = nettoyerVideoMp4(octets)!;
    assert.ok(propre, JSON.stringify(options));
    assert.equal(propre.length, octets.length);
    assert.equal(contient(propre, POSITION_VIDEO), false, JSON.stringify(options));
    assert.equal(contient(propre, "com.apple.quicktime.location"), false);
    assert.equal(contient(propre, "Apple"), false);
    assert.equal(datesRestantes(propre), false);
    assert.deepEqual(propre.subarray(image, image + IMAGE_VIDEO.length), IMAGE_VIDEO);
    assert.deepEqual(propre.subarray(son, son + SON_VIDEO.length), SON_VIDEO);
    assert.deepEqual(listerBoitesMp4(propre)!.map((b) => b.type), ["ftyp", "free", "free", "mdat", "moov"]);
    assert.ok(contient(octets, POSITION_VIDEO), "le fichier reçu n'est pas modifié");
  }
});

test("vidéo : les octets de mdat qu'aucune piste image ou son ne lit sont mis à zéro", () => {
  const { octets, image, son } = fabriquerVideoMp4({ sansGps: true, gpsOrphelin: true });
  assert.ok(contient(octets, POSITION_VIDEO));
  const propre = nettoyerVideoMp4(octets)!;
  assert.equal(contient(propre, POSITION_VIDEO), false);
  assert.deepEqual(propre.subarray(image, image + IMAGE_VIDEO.length), IMAGE_VIDEO);
  assert.deepEqual(propre.subarray(son, son + SON_VIDEO.length), SON_VIDEO);
});

test("vidéo fragmentée : métadonnées des fragments effacées, mais une piste de données y est refusée", () => {
  const sansGps = nettoyerVideoMp4(fabriquerVideoMp4({ sansGps: true, fragmentee: true }).octets)!;
  assert.ok(sansGps);
  assert.equal(contient(sansGps, POSITION_VIDEO), false);
  assert.equal(nettoyerVideoMp4(fabriquerVideoMp4({ fragmentee: true }).octets), null);
});

test("vidéo mal formée : refusée plutôt que gardée telle quelle", () => {
  assert.equal(nettoyerVideoMp4(fabriquerVideoMp4({ stszCasse: true }).octets), null, "piste image : plus d'échantillons que la table n'en décrit");
  assert.equal(nettoyerVideoMp4(fabriquerVideoMp4({ horsFichier: true }).octets), null, "piste image : échantillon hors du fichier");
  const { octets } = fabriquerVideoMp4();
  assert.equal(nettoyerVideoMp4(octets.subarray(0, octets.length - 3)), null, "fichier tronqué");
  assert.equal(nettoyerVideoMp4(octets.subarray(0, octets.indexOf("moov") - 4)), null, "sans moov");
});

test("photo JPEG : EXIF et GPS retirés, orientation gardée (Motorola comme Intel)", async () => {
  assert.equal(lireOrientationJpeg(PHOTO), null);
  for (const petit of [false, true]) {
    const brute = avecSegment(PHOTO, 0xe1, exifAvecOrientation(6, petit));
    assert.equal(lireOrientationJpeg(brute), 6);
    const prepare = await preparerMediaPublication(brute, false, nettoyerSurPlace);
    assert.ok(prepare.ok);
    assert.equal(contient(prepare.octets, "GPS"), false);
    assert.equal(contient(prepare.octets, "Apple"), false);
    assert.equal(lireOrientationJpeg(prepare.octets), 6);
    assert.deepEqual(retirerMetadonneesJpeg(prepare.octets), retirerMetadonneesJpeg(brute));
  }
  const droite = await preparerMediaPublication(avecSegment(PHOTO, 0xe1, exifAvecOrientation(1, false)), false, nettoyerSurPlace);
  assert.ok(droite.ok && !contient(droite.octets, "Exif"));
});

test("photo PNG nettoyée ; WebP, fichier inconnu et JPEG abîmé refusés ; WebP et WebM ne sont plus acceptés", async () => {
  const png = fabriquerPng({ largeur: 16, hauteur: 8, couleur: 2 });
  const bavard = Buffer.concat([png.subarray(0, 33), Buffer.from([0, 0, 0, 0]), Buffer.from("tEXt"), Buffer.from([0x0, 0x0, 0x0, 0x0]), png.subarray(33)]);
  const prepare = await preparerMediaPublication(png, false, nettoyerSurPlace);
  assert.ok(prepare.ok);
  assert.equal((await preparerMediaPublication(Buffer.from("RIFF\0\0\0\0WEBPVP8 "), false, nettoyerSurPlace)).ok, false);
  assert.deepEqual(await preparerMediaPublication(Buffer.from("pas une image"), false, nettoyerSurPlace), { ok: false, erreur: "format-refuse" });
  assert.deepEqual(await preparerMediaPublication(Buffer.concat([PHOTO.subarray(0, PHOTO.length - 2), Buffer.from("GPS")]), false, nettoyerSurPlace), { ok: false, erreur: "nettoyage-impossible" });
  assert.deepEqual(await preparerMediaPublication(bavard, false, nettoyerSurPlace), { ok: false, erreur: "nettoyage-impossible" }, "bloc au CRC faux");
  assert.deepEqual(Object.keys(FORMATS).sort(), ["image/jpeg", "image/png", "video/mp4", "video/quicktime"]);
});
