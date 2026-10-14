// Des MP4 / M4A d'essai, construits boîte par boîte (aucun encodeur sur le serveur) : une note vocale de 12,4 s (une piste
// « soun », codec « mp4a »), avec ou sans métadonnées (udta et meta, dont la position « ©xyz »), une vidéo (piste « vide »),
// une durée en mvhd version 0 ou 1. Les données audio sont factices (le serveur ne décode jamais le son) ; leur place dans
// le fichier sert à vérifier que rien ne bouge quand on neutralise les métadonnées.

/** Une boîte : taille sur 4 octets, type sur 4, puis le contenu */
function ecrireBoite(type: string, ...contenus: Uint8Array[]): Buffer {
  const contenu = Buffer.concat(contenus);
  const entete = Buffer.alloc(8);
  entete.writeUInt32BE(8 + contenu.length, 0);
  entete.write(type, 4, "latin1");
  return Buffer.concat([entete, contenu]);
}

const ecrireEntiers = (...valeurs: number[]) => {
  const b = Buffer.alloc(valeurs.length * 4);
  valeurs.forEach((v, i) => b.writeUInt32BE(v, i * 4));
  return b;
};

/** La position que les téléphones écrivent dans udta (QuickTime « ©xyz ») */
export const POSITION_ESSAI = "+47.2184-001.5536/";
/** Les données audio factices (repérables) */
export const SON_ESSAI = Buffer.from("SON-AAC-FACTICE-".repeat(64));

function ecrireMvhd(version: 0 | 1, echelle: number, duree: number): Buffer {
  if (version === 1) {
    const b = Buffer.alloc(112);
    b.writeUInt8(1, 0);
    b.writeUInt32BE(echelle, 20);
    b.writeBigUInt64BE(BigInt(duree), 24);
    return ecrireBoite("mvhd", b);
  }
  const b = Buffer.alloc(100);
  b.writeUInt32BE(echelle, 12);
  b.writeUInt32BE(duree, 16);
  return ecrireBoite("mvhd", b);
}

function ecrirePiste(type: "soun" | "vide", metadonnees: boolean): Buffer {
  const hdlr = ecrireBoite("hdlr", ecrireEntiers(0, 0), Buffer.from(type, "latin1"), Buffer.alloc(12), Buffer.from(type === "soun" ? "SoundHandler\0" : "VideoHandler\0"));
  const entree = ecrireBoite(type === "soun" ? "mp4a" : "avc1", Buffer.alloc(28));
  const stbl = ecrireBoite("stbl", ecrireBoite("stsd", ecrireEntiers(0, 1), entree), ecrireBoite("stts", ecrireEntiers(0, 0)), ecrireBoite("stsc", ecrireEntiers(0, 0)), ecrireBoite("stsz", ecrireEntiers(0, 0, 0)), ecrireBoite("stco", ecrireEntiers(0, 0)));
  const minf = ecrireBoite("minf", ecrireBoite(type === "soun" ? "smhd" : "vmhd", ecrireEntiers(0, 0)), ecrireBoite("dinf", ecrireBoite("dref", ecrireEntiers(0, 0))), stbl);
  const mdia = ecrireBoite("mdia", ecrireBoite("mdhd", Buffer.alloc(24)), hdlr, minf);
  return ecrireBoite("trak", ecrireBoite("tkhd", Buffer.alloc(84)), mdia, ...(metadonnees ? [ecrireBoite("udta", ecrireBoite("name", Buffer.from("Mémo de Léa")))] : []));
}

/** Une note vocale (par défaut : 12,4 s, une piste son AAC, avec métadonnées) ou une vidéo (pistes: ["vide", "soun"]) */
export function fabriquerMp4(o: { pistes?: ("soun" | "vide")[]; secondes?: number; version?: 0 | 1; metadonnees?: boolean } = {}): Buffer {
  const echelle = 44_100;
  const metadonnees = o.metadonnees ?? true;
  const udta = ecrireBoite("udta",
    ecrireBoite("©xyz", Buffer.from([0, POSITION_ESSAI.length, 0x15, 0xc7]), Buffer.from(POSITION_ESSAI, "latin1")),
    ecrireBoite("meta", ecrireEntiers(0), ecrireBoite("ilst", ecrireBoite("©nam", ecrireBoite("data", ecrireEntiers(1, 0), Buffer.from("Chez Léa, 12 rue des Gourmands"))))));
  const moov = ecrireBoite("moov", ecrireMvhd(o.version ?? 0, echelle, Math.round((o.secondes ?? 12.4) * echelle)), ...(o.pistes ?? ["soun"]).map((p) => ecrirePiste(p, metadonnees)), ...(metadonnees ? [udta] : []));
  return Buffer.concat([ecrireBoite("ftyp", Buffer.from("M4A ", "latin1"), ecrireEntiers(0), Buffer.from("M4A mp42isom", "latin1")), moov, ecrireBoite("mdat", SON_ESSAI)]);
}
