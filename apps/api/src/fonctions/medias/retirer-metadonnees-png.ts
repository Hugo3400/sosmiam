import { crc32 } from "node:zlib";

export type PassePng = { lignes: number; octetsParLigne: number };

export type PngNettoye = { octets: Buffer; largeur: number; hauteur: number; donnees: Buffer; passes: PassePng[] };

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PROFONDEURS: Readonly<Record<number, readonly number[]>> = { 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] };
const CANAUX: Readonly<Record<number, number>> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
const ADAM7 = [[0, 0, 8, 8], [4, 0, 8, 8], [0, 4, 4, 8], [2, 0, 4, 4], [0, 2, 2, 4], [1, 0, 2, 2], [0, 1, 1, 2]] as const;
const COULEURS = new Set(["gAMA", "cHRM", "sRGB"]);
const CRITIQUES = new Set(["IHDR", "PLTE", "IDAT", "IEND"]);
const ENTIER_MAX = 0x7fff_ffff;

const estTypeValide = (type: Buffer) => type.every((octet) => (octet >= 0x41 && octet <= 0x5a) || (octet >= 0x61 && octet <= 0x7a));

function calculerPasses(largeur: number, hauteur: number, bitsParPixel: number, entrelace: boolean): PassePng[] {
  const passe = (l: number, h: number) => ({ lignes: l > 0 ? h : 0, octetsParLigne: Math.ceil((l * bitsParPixel) / 8) });
  if (!entrelace) return [passe(largeur, hauteur)];
  return ADAM7.map(([x0, y0, dx, dy]) => passe(Math.max(0, Math.ceil((largeur - x0) / dx)), Math.max(0, Math.ceil((hauteur - y0) / dy))));
}

export function retirerMetadonneesPng(octets: Uint8Array): PngNettoye | null {
  const o = Buffer.from(octets.buffer, octets.byteOffset, octets.byteLength);
  if (o.length < SIGNATURE.length + 25 + 12 || !o.subarray(0, 8).equals(SIGNATURE)) return null;
  const gardes: Buffer[] = [SIGNATURE];
  const idat: Buffer[] = [];
  const vus = new Set<string>();
  let entete: { largeur: number; hauteur: number; profondeur: number; couleur: number; entrelace: boolean } | null = null;
  let finIdat = false;
  let entrees = 0;
  for (let i = SIGNATURE.length; ;) {
    if (i + 12 > o.length) return null;
    const longueur = o.readUInt32BE(i);
    if (longueur > ENTIER_MAX || i + 12 + longueur > o.length) return null;
    const typeOctets = o.subarray(i + 4, i + 8);
    if (!estTypeValide(typeOctets)) return null;
    const type = typeOctets.toString("latin1");
    const fin = i + 12 + longueur;
    if (crc32(o.subarray(i + 4, i + 8 + longueur)) !== o.readUInt32BE(i + 8 + longueur)) return null;
    const bloc = o.subarray(i, fin);
    const donnees = o.subarray(i + 8, i + 8 + longueur);
    if (!entete && type !== "IHDR") return null;
    if (idat.length > 0 && type !== "IDAT") finIdat = true;
    if (type === "IHDR") {
      if (entete || longueur !== 13) return null;
      const largeur = donnees.readUInt32BE(0);
      const hauteur = donnees.readUInt32BE(4);
      const [profondeur, couleur, compression, filtre, entrelacement] = donnees.subarray(8, 13);
      if (largeur === 0 || hauteur === 0 || largeur > ENTIER_MAX || hauteur > ENTIER_MAX) return null;
      if (!PROFONDEURS[couleur!]?.includes(profondeur!) || compression !== 0 || filtre !== 0 || entrelacement! > 1) return null;
      entete = { largeur, hauteur, profondeur: profondeur!, couleur: couleur!, entrelace: entrelacement === 1 };
      gardes.push(bloc);
    } else if (type === "PLTE") {
      if (vus.has("PLTE") || idat.length > 0 || longueur === 0 || longueur % 3 !== 0 || longueur > 768) return null;
      if (entete!.couleur === 0 || entete!.couleur === 4) return null;
      entrees = longueur / 3;
      gardes.push(bloc);
    } else if (type === "IDAT") {
      if (finIdat || (entete!.couleur === 3 && !vus.has("PLTE"))) return null;
      idat.push(donnees);
      gardes.push(bloc);
    } else if (type === "IEND") {
      if (longueur !== 0 || idat.length === 0) return null;
      gardes.push(bloc);
      break;
    } else if (CRITIQUES.has(type) || (typeOctets[0]! & 0x20) === 0) {
      return null;
    } else if (type === "tRNS") {
      const taille = entete!.couleur === 0 ? 2 : entete!.couleur === 2 ? 6 : entete!.couleur === 3 ? entrees : -1;
      const valide = entete!.couleur === 3 ? vus.has("PLTE") && longueur >= 1 && longueur <= taille : longueur === taille;
      if (!vus.has("tRNS") && idat.length === 0 && valide) gardes.push(bloc);
    } else if (COULEURS.has(type) && !vus.has(type) && !vus.has("PLTE") && idat.length === 0) {
      gardes.push(bloc);
    }
    vus.add(type);
    i = fin;
  }
  const e = entete!;
  const passes = calculerPasses(e.largeur, e.hauteur, CANAUX[e.couleur]! * e.profondeur, e.entrelace);
  return { octets: Buffer.concat(gardes), largeur: e.largeur, hauteur: e.hauteur, donnees: Buffer.concat(idat), passes };
}
