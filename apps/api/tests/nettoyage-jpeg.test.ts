import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { preparerPhotoAvis } from "../src/fonctions/avis/preparer-photo-avis.ts";
import { lireTailleJpeg } from "../src/fonctions/medias/lire-taille-jpeg.ts";
import { retirerMetadonneesJpeg } from "../src/fonctions/medias/retirer-metadonnees-jpeg.ts";
import { verifierPassagesJpeg } from "../src/fonctions/medias/verifier-passages-jpeg.ts";
import { avecSegment, avecSegmentAvant, listerPassagesJpeg, segmentsJpeg } from "./outils/fabriquer-photos-avis.ts";

const lireDonnee = (nom: string) => readFileSync(new URL(`./donnees/${nom}`, import.meta.url));
const PHOTO = lireDonnee("photo-avis-exif-position.jpg");
const PROGRESSIVE = lireDonnee("photo-progressive.jpg");
const INTERVALLES = lireDonnee("photo-intervalles-rst.jpg");
const PROPRE = retirerMetadonneesJpeg(PHOTO)!;
const GPS = "GPS 43.6108,3.8767";
const latin1 = (texte: string) => Buffer.from(texte, "latin1");
const jfif = (reglages: number[], enPlus = "") => Buffer.concat([latin1("JFIF\0"), Buffer.from(reglages), latin1(enPlus)]);
const JFIF_STANDARD = Buffer.concat([Buffer.from([0xff, 0xe0, 0x00, 0x10]), jfif([1, 1, 0, 0, 1, 0, 1, 0, 0])]);
const donneesCompressees = (o: Buffer) => o.subarray(listerPassagesJpeg(o)[0]!.debut);
const inserer = (o: Buffer, position: number, ajout: Buffer) => Buffer.concat([o.subarray(0, position), ajout, o.subarray(position)]);
const compter = (o: Buffer, motif: string) => o.toString("latin1").split(motif).length - 1;

test("APP0 : seul l'en-tête JFIF standard reste, sans vignette ni texte ; JFXX et doublons retirés", () => {
  assert.deepEqual(PROPRE.subarray(2, 2 + JFIF_STANDARD.length), JFIF_STANDARD);
  assert.deepEqual(segmentsJpeg(PROPRE).filter((m) => m === 0xe0), [0xe0]);
  const bavard = avecSegment(PHOTO, 0xe0, jfif([1, 1, 0, 0, 1, 0, 1, 0, 0], `APP0 ${GPS}`));
  assert.equal(compter(bavard, GPS), 1);
  assert.deepEqual(retirerMetadonneesJpeg(bavard), PROPRE, "texte après l'en-tête et second JFIF");
  assert.deepEqual(retirerMetadonneesJpeg(avecSegment(PHOTO, 0xe0, Buffer.concat([latin1("JFXX\0\x13"), latin1(GPS)]))), PROPRE, "JFXX");
  const vignette = retirerMetadonneesJpeg(avecSegment(PHOTO, 0xe0, jfif([1, 2, 1, 0, 72, 0, 72, 2, 1], `${"\x7f".repeat(6)}${GPS}`)))!;
  assert.deepEqual(vignette.subarray(2, 20), Buffer.concat([Buffer.from([0xff, 0xe0, 0x00, 0x10]), jfif([1, 1, 1, 0, 72, 0, 72, 0, 0])]), "densité gardée, vignette 0 × 0");
  assert.deepEqual(vignette.subarray(20), PROPRE.subarray(20));
  assert.deepEqual(retirerMetadonneesJpeg(avecSegment(PHOTO, 0xe0, jfif([1, 1, 7, 0, 1, 0, 1, 0, 0])))!.subarray(2, 20), JFIF_STANDARD, "unité inconnue");
  assert.deepEqual(retirerMetadonneesJpeg(avecSegment(PHOTO, 0xe0, latin1("JFIF\0\x01"))), PROPRE, "en-tête trop court");
});

test("DNL (FF DC), DHP, EXP, JPG, JPGn et marqueurs réservés : retirés, données compressées intactes", () => {
  for (const marqueur of [0xdc, 0xde, 0xdf, 0xc8, 0xf0, 0xfd, 0x02, 0xbf]) {
    const brute = avecSegmentAvant(PHOTO, 0xda, marqueur, latin1(`${GPS} #${marqueur}`));
    assert.deepEqual(retirerMetadonneesJpeg(brute), PROPRE, `FF ${marqueur.toString(16)}`);
  }
  assert.deepEqual(donneesCompressees(PROPRE), donneesCompressees(PHOTO));
});

test("APP14 « Adobe » trop court, suivi d'un DQT : retiré, rien n'est lu au-delà du segment", () => {
  const court = avecSegmentAvant(PHOTO, 0xdb, 0xee, latin1("Adobe\0d"));
  assert.equal(court[court.indexOf("Adobe") + 11], 0x00, "l'octet lu par erreur serait une transformation valable");
  assert.deepEqual(retirerMetadonneesJpeg(court), PROPRE);
});

test("octets parasites dans les données compressées : refusés, à la fin d'un passage comme avant un RST", () => {
  const avantFin = (o: Buffer, ajout: Buffer) => inserer(o, o.length - 2, ajout);
  assert.equal(retirerMetadonneesJpeg(avantFin(PHOTO, latin1(`QUEUE ${GPS}`))), null);
  assert.deepEqual(preparerPhotoAvis(avantFin(PHOTO, latin1(GPS))), { ok: false, erreur: "media-invalide", champ: "format" });
  assert.ok(retirerMetadonneesJpeg(avantFin(PHOTO, Buffer.from([0xff, 0xff]))), "du remplissage (FF) avant la fin reste permis");
  for (const [nom, photo] of [["séquentielle", PHOTO], ["progressive", PROGRESSIVE], ["avec RST", INTERVALLES]] as const) {
    const passages = listerPassagesJpeg(photo);
    assert.deepEqual(donneesCompressees(retirerMetadonneesJpeg(photo)!), donneesCompressees(photo), nom);
    for (const { fin } of passages) {
      assert.equal(retirerMetadonneesJpeg(inserer(photo, fin, Buffer.from([0x12]))), null, `${nom} : un octet avant ${fin}`);
      assert.equal(retirerMetadonneesJpeg(inserer(photo, fin, Buffer.from([0xff, 0x00]))), null, `${nom} : FF00 avant ${fin}`);
    }
    for (const position of passages.flatMap((p) => p.rst)) {
      assert.equal(retirerMetadonneesJpeg(inserer(photo, position, Buffer.from([0x12, 0x34]))), null, `${nom} : avant le RST ${position}`);
    }
  }
  assert.equal(listerPassagesJpeg(PROGRESSIVE).length, 10);
  assert.ok(segmentsJpeg(INTERVALLES).includes(0xdd) && listerPassagesJpeg(INTERVALLES)[0]!.rst.length >= 3);
});

test("intervalle de reprise (DRI) qui ne tombe pas sur les RST : refusé", () => {
  const dri = INTERVALLES.indexOf(Buffer.from([0xff, 0xdd, 0x00, 0x04]));
  assert.equal(INTERVALLES.readUInt16BE(dri + 4), 3);
  for (const intervalle of [0, 2, 4]) {
    const autre = Buffer.from(INTERVALLES);
    autre.writeUInt16BE(intervalle, dri + 4);
    assert.equal(retirerMetadonneesJpeg(autre), null, `DRI ${intervalle}`);
  }
});

test("verifierPassagesJpeg : seulement Huffman 8 ou 12 bits (SOF0 à SOF2), tables et passages bien formés", () => {
  assert.equal(verifierPassagesJpeg(PROPRE), true);
  const sof = PHOTO.indexOf(Buffer.from([0xff, 0xc0]));
  for (const marqueur of [0xc3, 0xc5, 0xc9, 0xcd]) {
    const autre = Buffer.from(PHOTO);
    autre[sof + 1] = marqueur;
    assert.ok(lireTailleJpeg(autre), `FF ${marqueur.toString(16)} : dimensions lisibles`);
    assert.equal(retirerMetadonneesJpeg(autre), null, `FF ${marqueur.toString(16)} : refusé`);
  }
  const table = (classeNumero: number, nombres: Record<number, number>, valeurs: number[]) =>
    Buffer.concat([Buffer.from([classeNumero]), Buffer.from(Array.from({ length: 16 }, (_, k) => nombres[k + 1] ?? 0)), Buffer.from(valeurs)]);
  const avecTable = (contenu: Buffer) => retirerMetadonneesJpeg(avecSegmentAvant(PHOTO, 0xda, 0xc4, contenu));
  assert.ok(avecTable(table(0x03, { 2: 3 }, [0, 1, 2])), "table DC n° 3 bien formée, inutilisée");
  assert.ok(avecTable(table(0x13, { 1: 1 }, [0xf0])), "table AC n° 3 bien formée, inutilisée");
  for (const [contenu, cas] of [
    [table(0x03, { 1: 3 }, [1, 2, 3]), "trois codes d'un bit"],
    [table(0x03, { 1: 2 }, [1, 2]), "deux codes d'un bit : l'un serait « 1 », que des uns"],
    [table(0x13, { 9: 255, 10: 2 }, Array.from({ length: 257 }, (_, k) => k & 0xff)), "257 symboles"],
    [table(0x13, { 2: 3 }, [0, 1]), "symboles manquants"],
    [table(0x03, { 1: 1 }, [16]), "taille DC au-delà de 15"],
    [table(0x14, { 1: 1 }, [0]), "table n° 4"],
    [table(0x23, { 1: 1 }, [0]), "classe 2"],
  ] as const) {
    assert.equal(avecTable(contenu), null, cas);
  }
});

test("fin des données : RST final et image tronquée sur un intervalle permis ; DRI de mauvaise longueur refusé", () => {
  const avantFin = (o: Buffer, ajout: number[]) => inserer(o, o.length - 2, Buffer.from(ajout));
  assert.ok(retirerMetadonneesJpeg(avantFin(PHOTO, [0xff, 0xd0])), "un RST de trop, sans rien derrière");
  assert.equal(retirerMetadonneesJpeg(avantFin(PHOTO, [0xff, 0xd0, 0xff, 0x00, 0x00, 0x02])), null, "un octet échappé après le RST");
  const premierRst = listerPassagesJpeg(INTERVALLES)[0]!.rst[0]!;
  assert.ok(retirerMetadonneesJpeg(Buffer.concat([INTERVALLES.subarray(0, premierRst), Buffer.from([0xff, 0xd9])])), "coupée au premier RST");
  assert.ok(retirerMetadonneesJpeg(avecSegmentAvant(PHOTO, 0xda, 0xdd, Buffer.from([0, 0]))), "DRI nul");
  assert.equal(retirerMetadonneesJpeg(avecSegmentAvant(PHOTO, 0xda, 0xdd, Buffer.from([0, 0, 0, 0]))), null, "DRI trop long");
});

test("image progressive : 32 passages au plus, et pas plus d'un million de blocs par composante", () => {
  const passages = listerPassagesJpeg(PROGRESSIVE);
  const affinage = passages.find((p) => PROGRESSIVE[p.debut + 4] === 3 && PROGRESSIVE[p.debut + 13]! >> 4 > 0)!;
  const repeter = (fois: number) => {
    const copie = PROGRESSIVE.subarray(affinage.debut, affinage.fin);
    return Buffer.concat([PROGRESSIVE.subarray(0, affinage.fin), ...Array.from({ length: fois }, () => copie), PROGRESSIVE.subarray(affinage.fin)]);
  };
  assert.ok(retirerMetadonneesJpeg(repeter(22)), "32 passages");
  assert.equal(retirerMetadonneesJpeg(repeter(23)), null, "33 passages");
  const agrandir = (largeur: number, hauteur: number) => {
    const copie = Buffer.from(PROGRESSIVE);
    const sof = copie.indexOf(Buffer.from([0xff, 0xc2]));
    copie.writeUInt16BE(hauteur, sof + 5);
    copie.writeUInt16BE(largeur, sof + 7);
    return copie;
  };
  assert.ok(retirerMetadonneesJpeg(agrandir(8192, 8184)), "1 047 552 blocs");
  assert.equal(retirerMetadonneesJpeg(agrandir(8192, 8200)), null, "1 049 600 blocs");
});
