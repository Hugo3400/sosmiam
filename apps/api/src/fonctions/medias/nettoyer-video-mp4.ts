import { listerBoitesMp4, type BoiteMp4 } from "./lister-boites-mp4.ts";

const CONTENEURS = new Set(["moov", "trak", "mdia", "minf", "dinf", "edts", "stbl", "mvex", "moof", "traf"]);
const METADONNEES = new Set(["udta", "meta", "uuid"]);
const VIDES = new Set(["free", "skip", "wide"]);
const DATEES = new Set(["mvhd", "tkhd", "mdhd"]);
const PISTES_GARDEES = new Set(["vide", "soun"]);
const FREE = [0x66, 0x72, 0x65, 0x65];
const PROFONDEUR_MAX = 8;

function nettoyerNiveau(copie: Buffer, debut: number, fin: number, profondeur: number): boolean {
  const boites = listerBoitesMp4(copie, debut, fin);
  if (!boites) return false;
  for (const boite of boites) {
    if (METADONNEES.has(boite.type)) {
      copie.set(FREE, boite.debut + 4);
      copie.fill(0, boite.contenu, boite.fin);
    } else if (VIDES.has(boite.type)) {
      copie.fill(0, boite.contenu, boite.fin);
    } else if (DATEES.has(boite.type)) {
      const longueur = copie[boite.contenu] === 1 ? 16 : 8;
      if (boite.fin - boite.contenu < 4 + longueur) return false;
      copie.fill(0, boite.contenu + 4, boite.contenu + 4 + longueur);
    } else if (CONTENEURS.has(boite.type)) {
      if (profondeur >= PROFONDEUR_MAX || !nettoyerNiveau(copie, boite.contenu, boite.fin, profondeur + 1)) return false;
    }
  }
  return true;
}

const enfants = (copie: Buffer, parent: BoiteMp4 | undefined) => (parent ? listerBoitesMp4(copie, parent.contenu, parent.fin) ?? [] : []);
const enfant = (copie: Buffer, parent: BoiteMp4 | undefined, type: string) => enfants(copie, parent).find((b) => b.type === type);

function lirePiste(copie: Buffer, trak: BoiteMp4) {
  const mdia = enfant(copie, trak, "mdia");
  const hdlr = enfant(copie, mdia, "hdlr");
  if (!hdlr || hdlr.fin - hdlr.contenu < 12) return null;
  return { genre: copie.toString("latin1", hdlr.contenu + 8, hdlr.contenu + 12), stbl: enfant(copie, enfant(copie, mdia, "minf"), "stbl") };
}

function lireMorceaux(copie: Buffer, stbl: BoiteMp4 | undefined): [number, number][] | null {
  const stsz = enfant(copie, stbl, "stsz");
  const stsc = enfant(copie, stbl, "stsc");
  const stco = enfant(copie, stbl, "stco") ?? enfant(copie, stbl, "co64");
  if (!stsz || !stsc || !stco || stsz.fin - stsz.contenu < 12 || stsc.fin - stsc.contenu < 8 || stco.fin - stco.contenu < 8) return null;
  const tailleFixe = copie.readUInt32BE(stsz.contenu + 4);
  const echantillons = copie.readUInt32BE(stsz.contenu + 8);
  if (tailleFixe === 0 ? stsz.contenu + 12 + echantillons * 4 > stsz.fin : tailleFixe * echantillons > copie.length) return null;
  const regles = copie.readUInt32BE(stsc.contenu + 4);
  if (stsc.contenu + 8 + regles * 12 > stsc.fin) return null;
  const large = stco.type === "co64";
  const nombre = copie.readUInt32BE(stco.contenu + 4);
  if (stco.contenu + 8 + nombre * (large ? 8 : 4) > stco.fin) return null;
  const regle = (k: number) => ({ premier: copie.readUInt32BE(stsc.contenu + 8 + k * 12), parMorceau: copie.readUInt32BE(stsc.contenu + 12 + k * 12) });
  if (echantillons > 0 && (regles === 0 || regle(0).premier !== 1)) return null;
  const morceaux: [number, number][] = [];
  let numero = 0;
  let total = 0;
  let r = 0;
  for (let m = 1; m <= nombre && numero < echantillons; m++) {
    while (r + 1 < regles && regle(r + 1).premier <= m) r += 1;
    const position = large ? copie.readBigUInt64BE(stco.contenu + 8 + (m - 1) * 8) : BigInt(copie.readUInt32BE(stco.contenu + 8 + (m - 1) * 4));
    if (position > BigInt(copie.length)) return null;
    const debut = Number(position);
    let fin = debut;
    for (let k = 0; k < regle(r).parMorceau && numero < echantillons; k++, numero++) fin += tailleFixe || copie.readUInt32BE(stsz.contenu + 12 + numero * 4);
    total += fin - debut;
    if (fin > copie.length || total > copie.length) return null;
    morceaux.push([debut, fin]);
  }
  return numero === echantillons ? morceaux : null;
}

function effacerHorsMorceaux(copie: Buffer, mdat: BoiteMp4, morceaux: readonly [number, number][]): boolean {
  let curseur = mdat.contenu;
  for (const [debut, fin] of morceaux) {
    if (fin <= mdat.contenu || debut >= mdat.fin) continue;
    if (debut < mdat.contenu || fin > mdat.fin) return false;
    if (debut > curseur) copie.fill(0, curseur, debut);
    curseur = Math.max(curseur, fin);
  }
  copie.fill(0, curseur, mdat.fin);
  return true;
}

export function nettoyerVideoMp4(octets: Uint8Array): Buffer | null {
  const copie = Buffer.from(octets);
  const haut = listerBoitesMp4(copie);
  const moov = haut?.filter((b) => b.type === "moov") ?? [];
  if (!haut || moov.length !== 1) return null;
  const fragmentee = haut.some((b) => b.type === "moof");
  const gardes: [number, number][] = [];
  for (const trak of enfants(copie, moov[0]).filter((b) => b.type === "trak")) {
    const piste = lirePiste(copie, trak);
    if (!piste || (fragmentee && !PISTES_GARDEES.has(piste.genre))) return null;
    if (fragmentee || !PISTES_GARDEES.has(piste.genre)) continue;
    const morceaux = lireMorceaux(copie, piste.stbl);
    if (!morceaux) return null;
    gardes.push(...morceaux);
  }
  gardes.sort((a, b) => a[0] - b[0]);
  if (!fragmentee && !haut.filter((b) => b.type === "mdat").every((mdat) => effacerHorsMorceaux(copie, mdat, gardes))) return null;
  return nettoyerNiveau(copie, 0, copie.length, 0) ? copie : null;
}
