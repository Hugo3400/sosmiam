export const HEIC = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from("ftypheic\0\0\0\0mif1heic", "latin1"), Buffer.alloc(64)]);
export const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)]);

export function segmentsJpeg(octets: Uint8Array): number[] {
  const marqueurs: number[] = [];
  let i = 2;
  while (i + 4 <= octets.length && octets[i] === 0xff) {
    const marqueur = octets[i + 1]!;
    marqueurs.push(marqueur);
    if (marqueur === 0xda || marqueur === 0xd9) break;
    i += 2 + ((octets[i + 2]! << 8) | octets[i + 3]!);
  }
  return marqueurs;
}

export function avecSegmentApp13(octets: Uint8Array, secret: string): Buffer {
  const contenu = Buffer.concat([Buffer.from("Photoshop 3.0\0", "latin1"), Buffer.from("8BIM", "latin1"), Buffer.from([0x04, 0x04, 0, 0]), Buffer.from(secret, "latin1")]);
  const entete = Buffer.from([0xff, 0xed, (contenu.length + 2) >> 8, (contenu.length + 2) & 0xff]);
  return Buffer.concat([octets.subarray(0, 2), entete, contenu, octets.subarray(2)]);
}

export function avecSegment(octets: Uint8Array, marqueur: number, contenu: Uint8Array): Buffer {
  const entete = Buffer.from([0xff, marqueur, (contenu.length + 2) >> 8, (contenu.length + 2) & 0xff]);
  return Buffer.concat([octets.subarray(0, 2), entete, contenu, octets.subarray(2)]);
}

export function avecDimensions(octets: Uint8Array, largeur: number, hauteur: number): Buffer {
  const copie = Buffer.from(octets);
  const sof = copie.indexOf(Buffer.from([0xff, 0xc0]));
  copie.writeUInt16BE(hauteur, sof + 5);
  copie.writeUInt16BE(largeur, sof + 7);
  return copie;
}

export function avecSegmentAvant(octets: Uint8Array, suivant: number, marqueur: number, contenu: Uint8Array): Buffer {
  let i = 2;
  while (octets[i + 1] !== suivant) i += 2 + ((octets[i + 2]! << 8) | octets[i + 3]!);
  const entete = Buffer.from([0xff, marqueur, (contenu.length + 2) >> 8, (contenu.length + 2) & 0xff]);
  return Buffer.concat([octets.subarray(0, i), entete, contenu, octets.subarray(i)]);
}

export function listerPassagesJpeg(octets: Uint8Array): { debut: number; fin: number; rst: number[] }[] {
  const passages: { debut: number; fin: number; rst: number[] }[] = [];
  let i = 2;
  while (i + 4 <= octets.length && octets[i] === 0xff && octets[i + 1] !== 0xd9) {
    const fin = i + 2 + ((octets[i + 2]! << 8) | octets[i + 3]!);
    if (octets[i + 1] !== 0xda) {
      i = fin;
      continue;
    }
    const rst: number[] = [];
    let j = fin;
    for (;;) {
      const ff = octets.indexOf(0xff, j);
      const suivant = octets[ff + 1]!;
      if (suivant >= 0xd0 && suivant <= 0xd7) rst.push(ff);
      if (suivant === 0x00 || suivant === 0xff || (suivant >= 0xd0 && suivant <= 0xd7)) j = ff + (suivant === 0xff ? 1 : 2);
      else {
        passages.push({ debut: i, fin: ff, rst });
        i = ff;
        break;
      }
    }
  }
  return passages;
}
