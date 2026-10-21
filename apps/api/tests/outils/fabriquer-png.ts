import { crc32, deflateSync } from "node:zlib";

export type ReglagesPng = {
  largeur?: number;
  hauteur?: number;
  couleur?: number;
  profondeur?: number;
  entrelace?: boolean;
  avant?: Buffer[];
  apres?: Buffer[];
  fin?: Buffer;
  brut?: Buffer;
  idat?: Buffer;
};

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CANAUX: Record<number, number> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
const ADAM7 = [[0, 0, 8, 8], [4, 0, 8, 8], [0, 4, 4, 8], [2, 0, 4, 4], [0, 2, 2, 4], [1, 0, 2, 2], [0, 1, 1, 2]];

export function fabriquerBlocPng(type: string, donnees: Buffer = Buffer.alloc(0)): Buffer {
  const longueur = Buffer.alloc(4);
  longueur.writeUInt32BE(donnees.length);
  const corps = Buffer.concat([Buffer.from(type, "latin1"), donnees]);
  const controle = Buffer.alloc(4);
  controle.writeUInt32BE(crc32(corps));
  return Buffer.concat([longueur, corps, controle]);
}

export function fabriquerDonneesBrutesPng(largeur: number, hauteur: number, couleur = 2, profondeur = 8, entrelace = false): Buffer {
  const bits = CANAUX[couleur]! * profondeur;
  const passes = entrelace
    ? ADAM7.map(([x0, y0, dx, dy]) => [Math.max(0, Math.ceil((largeur - x0!) / dx!)), Math.max(0, Math.ceil((hauteur - y0!) / dy!))])
    : [[largeur, hauteur]];
  const lignes: Buffer[] = [];
  for (const [l, h] of passes) {
    if (l === 0 || h === 0) continue;
    const octets = Math.ceil((l! * bits) / 8);
    for (let y = 0; y < h!; y++) lignes.push(Buffer.concat([Buffer.from([y % 5]), Buffer.alloc(octets, (y * 37) & 0xff)]));
  }
  return Buffer.concat(lignes);
}

export function fabriquerPng(r: ReglagesPng = {}): Buffer {
  const largeur = r.largeur ?? 16;
  const hauteur = r.hauteur ?? 8;
  const couleur = r.couleur ?? 2;
  const profondeur = r.profondeur ?? 8;
  const entete = Buffer.alloc(13);
  entete.writeUInt32BE(largeur, 0);
  entete.writeUInt32BE(hauteur, 4);
  entete.set([profondeur, couleur, 0, 0, r.entrelace ? 1 : 0], 8);
  const idat = r.idat ?? deflateSync(r.brut ?? fabriquerDonneesBrutesPng(largeur, hauteur, couleur, profondeur, r.entrelace));
  return Buffer.concat([
    SIGNATURE,
    fabriquerBlocPng("IHDR", entete),
    ...(r.avant ?? []),
    fabriquerBlocPng("IDAT", idat),
    ...(r.apres ?? []),
    fabriquerBlocPng("IEND"),
    r.fin ?? Buffer.alloc(0),
  ]);
}
