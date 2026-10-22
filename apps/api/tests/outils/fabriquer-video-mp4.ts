export const POSITION_VIDEO = "+48.8566+002.3522/";
export const DATE_VIDEO = 0x7a6b5c4d;
export const IMAGE_VIDEO = Buffer.from("IMAGE-HEVC-FACTICE-".repeat(40));
export const SON_VIDEO = Buffer.from("SON-AAC-FACTICE-".repeat(20));

const boite = (type: string, ...contenus: (Uint8Array | string)[]) => {
  const contenu = Buffer.concat(contenus.map((c) => (typeof c === "string" ? Buffer.from(c, "latin1") : c)));
  const entete = Buffer.alloc(8);
  entete.writeUInt32BE(8 + contenu.length, 0);
  entete.write(type, 4, "latin1");
  return Buffer.concat([entete, contenu]);
};

const entiers = (...valeurs: number[]) => {
  const b = Buffer.alloc(valeurs.length * 4);
  valeurs.forEach((v, i) => b.writeUInt32BE(v, i * 4));
  return b;
};

const daté = (type: string, version: 0 | 1, taille: number) => {
  const b = Buffer.alloc(taille);
  b.writeUInt8(version, 0);
  if (version === 1) {
    b.writeBigUInt64BE(BigInt(DATE_VIDEO), 4);
    b.writeBigUInt64BE(BigInt(DATE_VIDEO), 12);
  } else {
    b.writeUInt32BE(DATE_VIDEO, 4);
    b.writeUInt32BE(DATE_VIDEO, 8);
  }
  return boite(type, b);
};

type Piste = { genre: string; positions: number[]; tailles: number[]; fixe?: boolean; large?: boolean; parMorceau?: number };

function piste({ genre, positions, tailles, fixe, large, parMorceau = 1 }: Piste) {
  const stsz = fixe ? boite("stsz", entiers(0, tailles[0]!, tailles.length)) : boite("stsz", entiers(0, 0, tailles.length, ...tailles));
  const stco = large
    ? boite("co64", entiers(0, positions.length), ...positions.map((p) => { const b = Buffer.alloc(8); b.writeBigUInt64BE(BigInt(p)); return b; }))
    : boite("stco", entiers(0, positions.length, ...positions));
  const stbl = boite("stbl", boite("stsd", entiers(0, 0)), boite("stsc", entiers(0, 1, 1, parMorceau, 1)), stsz, stco);
  const hdlr = boite("hdlr", entiers(0, 0), genre, Buffer.alloc(12), "Core Media\0");
  const mdia = boite("mdia", daté("mdhd", 0, 24), hdlr, boite("minf", boite("dinf", boite("dref", entiers(0, 0))), stbl));
  return boite("trak", daté("tkhd", 1, 96), mdia, boite("meta", boite("keys", "com.apple.quicktime.camera.identifier")));
}

export type OptionsVideo = { large?: boolean; fixe?: boolean; sansGps?: boolean; gpsOrphelin?: boolean; fragmentee?: boolean; stszCasse?: boolean; horsFichier?: boolean };

export function fabriquerVideoMp4(o: OptionsVideo = {}): { octets: Buffer; image: number; son: number } {
  const gps = [1, 2].map((n) => Buffer.from(`GPS5 ${POSITION_VIDEO} n${n}`.padEnd(32, ".")));
  const ftyp = boite("ftyp", "qt  ", entiers(0), "qt  ");
  const xmp = boite("uuid", Buffer.alloc(16, 0xbe), `<x:xmpmeta><exif:GPSLatitude>${POSITION_VIDEO}</exif:GPSLatitude></x:xmpmeta>`);
  const vieux = boite("free", `ancienne position ${POSITION_VIDEO}`);
  const avant = ftyp.length + xmp.length + vieux.length + 8;
  const image = avant;
  const avecGps = !o.sansGps || o.gpsOrphelin;
  const gps1 = image + IMAGE_VIDEO.length;
  const son = gps1 + (avecGps ? 32 : 0);
  const gps2 = son + SON_VIDEO.length;
  const mdat = boite("mdat", IMAGE_VIDEO, ...(avecGps ? [gps[0]!] : []), SON_VIDEO, ...(avecGps ? [gps[1]!] : []));
  const pistes = [
    piste({ genre: "vide", positions: [o.horsFichier ? 0x7fff_0000 : image], tailles: o.stszCasse ? [IMAGE_VIDEO.length, 32] : [IMAGE_VIDEO.length], large: o.large }),
    piste({ genre: "soun", positions: [son], tailles: [SON_VIDEO.length], large: o.large }),
    ...(o.sansGps ? [] : [piste({
      genre: "meta",
      positions: [gps1, gps2],
      tailles: [32, 32],
      fixe: o.fixe,
      large: o.large,
    })]),
  ];
  const meta = boite("meta",
    boite("hdlr", entiers(0, 0), "mdta", Buffer.alloc(12), "\0"),
    boite("keys", entiers(0, 1), boite("mdta", "com.apple.quicktime.location.ISO6709")),
    boite("ilst", boite("\0\0\0\x01", boite("data", entiers(1, 0), POSITION_VIDEO))));
  const udta = boite("udta", boite("©xyz", Buffer.from([0, POSITION_VIDEO.length, 0x15, 0xc7]), POSITION_VIDEO), boite("©mak", "Apple"));
  const moov = boite("moov", daté("mvhd", 0, 100), ...pistes, meta, udta);
  const moof = boite("moof", boite("mfhd", entiers(0, 1)), boite("traf", boite("tfhd", entiers(0, 1)), boite("udta", boite("©xyz", POSITION_VIDEO))));
  if (o.stszCasse) {
    const casse = Buffer.concat([ftyp, xmp, vieux, mdat, moov]);
    const i = casse.indexOf("stsz");
    casse.writeUInt32BE(1_000_000, i + 12);
    return { octets: casse, image, son };
  }
  return { octets: Buffer.concat([ftyp, xmp, vieux, mdat, moov, ...(o.fragmentee ? [moof] : [])]), image, son };
}
