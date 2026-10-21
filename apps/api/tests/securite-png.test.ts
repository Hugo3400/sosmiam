import assert from "node:assert/strict";
import { test } from "node:test";
import { deflateSync } from "node:zlib";

import { retirerMetadonneesPng } from "../src/fonctions/medias/retirer-metadonnees-png.ts";
import { verifierDonneesPng } from "../src/fonctions/medias/verifier-donnees-png.ts";
import { fabriquerBlocPng, fabriquerDonneesBrutesPng, fabriquerPng } from "./outils/fabriquer-png.ts";

const blocs = (o: Buffer) => {
  const types: string[] = [];
  for (let i = 8; i + 8 <= o.length; i += 12 + o.readUInt32BE(i)) types.push(o.toString("latin1", i + 4, i + 8));
  return types;
};
const verifier = async (o: Buffer) => {
  const png = retirerMetadonneesPng(o);
  return png !== null && (await verifierDonneesPng(png.donnees, png.passes));
};

test("seuls IHDR, PLTE, tRNS, sRGB, gAMA, cHRM, IDAT et IEND restent ; texte, EXIF, date et blocs privés partent", () => {
  const bavard = fabriquerPng({
    couleur: 3,
    avant: [
      fabriquerBlocPng("gAMA", Buffer.from([0, 0, 0xb1, 0x8f])),
      fabriquerBlocPng("tEXt", Buffer.from("Software\0TelephoneDeZoe", "latin1")),
      fabriquerBlocPng("PLTE", Buffer.alloc(9, 0x80)),
      fabriquerBlocPng("tRNS", Buffer.from([0, 255])),
      fabriquerBlocPng("pHYs", Buffer.alloc(9, 1)),
      fabriquerBlocPng("iCCP", Buffer.from("profil\0\0données", "latin1")),
      fabriquerBlocPng("prVt", Buffer.from("bloc privé")),
    ],
    apres: [fabriquerBlocPng("tIME", Buffer.alloc(7, 1)), fabriquerBlocPng("eXIf", Buffer.from("MM\0*GPS"))],
    brut: Buffer.concat(Array.from({ length: 8 }, () => Buffer.concat([Buffer.from([0]), Buffer.alloc(16, 1)]))),
  });
  const propre = retirerMetadonneesPng(bavard)!;
  assert.deepEqual(blocs(propre.octets), ["IHDR", "gAMA", "PLTE", "tRNS", "IDAT", "IEND"]);
  assert.deepEqual([propre.largeur, propre.hauteur], [16, 8]);
  assert.ok(!propre.octets.includes("TelephoneDeZoe") && !propre.octets.includes("GPS"));
  assert.deepEqual(retirerMetadonneesPng(propre.octets)?.octets, propre.octets, "déjà propre : inchangé");
});

test("refusés : signature, en-tête, CRC, ordre des blocs, bloc critique inconnu, palette manquante, IEND absent", () => {
  const bon = fabriquerPng();
  assert.ok(retirerMetadonneesPng(bon));
  const crc = Buffer.from(bon);
  crc[8 + 12 + 13 - 1] ^= 0xff;
  const entete = (profondeur: number, couleur: number, entrelace = 0) => {
    const d = Buffer.alloc(13);
    d.writeUInt32BE(4, 0);
    d.writeUInt32BE(4, 4);
    d.set([profondeur, couleur, 0, 0, entrelace], 8);
    return Buffer.concat([bon.subarray(0, 8), fabriquerBlocPng("IHDR", d), bon.subarray(33)]);
  };
  const sansIend = bon.subarray(0, bon.length - 12);
  const cas: [string, Buffer][] = [
    ["signature", Buffer.concat([Buffer.from("x"), bon.subarray(1)])],
    ["CRC", crc],
    ["profondeur 16 en palette", entete(16, 3)],
    ["couleur 5", entete(8, 5)],
    ["entrelacement 2", entete(8, 2, 2)],
    ["sans IEND", sansIend],
    ["bloc critique inconnu", fabriquerPng({ avant: [fabriquerBlocPng("ZZZZ")] })],
    ["type de bloc illisible", fabriquerPng({ avant: [fabriquerBlocPng("a\0bc")] })],
    ["palette sans PLTE", fabriquerPng({ couleur: 3 })],
    ["PLTE en niveaux de gris", fabriquerPng({ couleur: 0, avant: [fabriquerBlocPng("PLTE", Buffer.alloc(3))] })],
    ["IDAT coupés", fabriquerPng({ apres: [fabriquerBlocPng("tEXt", Buffer.from("a\0b")), fabriquerBlocPng("IDAT", Buffer.from([0]))] })],
    ["IHDR en double", fabriquerPng({ avant: [fabriquerBlocPng("IHDR", Buffer.alloc(13))] })],
    ["longueur qui déborde", Buffer.concat([bon.subarray(0, 8), Buffer.from([0x7f, 0, 0, 0]), bon.subarray(12)])],
  ];
  for (const [nom, octets] of cas) assert.equal(retirerMetadonneesPng(octets), null, nom);
});

test("données compressées : taille exacte, octet de filtre de 0 à 4, entrelacement Adam7", async () => {
  assert.equal(await verifier(fabriquerPng()), true);
  assert.equal(await verifier(fabriquerPng({ largeur: 13, hauteur: 11, couleur: 6, entrelace: true })), true, "Adam7");
  assert.equal(await verifier(fabriquerPng({ largeur: 3, hauteur: 2, couleur: 0, profondeur: 1, entrelace: true })), true, "Adam7, passes vides");
  assert.equal(await verifier(fabriquerPng({ largeur: 9, hauteur: 5, couleur: 4, profondeur: 16 })), true, "16 bits");
  const brut = fabriquerDonneesBrutesPng(16, 8);
  assert.equal(await verifier(fabriquerPng({ brut: brut.subarray(0, brut.length - 1) })), false, "une ligne trop courte");
  assert.equal(await verifier(fabriquerPng({ brut: Buffer.concat([brut, Buffer.from([0])]) })), false, "trop de données");
  const filtre = Buffer.from(brut);
  filtre[49 * 3] = 9;
  assert.equal(await verifier(fabriquerPng({ brut: filtre })), false, "filtre 9 sur la 4e ligne");
  assert.equal(await verifier(fabriquerPng({ idat: deflateSync(brut).subarray(0, 20) })), false, "flux coupé");
  const bombe = fabriquerPng({ largeur: 1, hauteur: 1, idat: deflateSync(Buffer.alloc(50 * 1024 * 1024)) });
  assert.equal(await verifier(bombe), false, "bombe de décompression arrêtée");
});
