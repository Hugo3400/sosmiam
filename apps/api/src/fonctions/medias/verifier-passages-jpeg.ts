type TableHuffman = { maxcode: Int32Array; valptr: Int32Array; mincode: Int32Array; valeurs: Uint8Array; rapide: Uint16Array };
type Composante = { id: number; h: number; v: number; largeur: number; hauteur: number; nonNuls: Uint32Array | null };
type Image = { progressive: boolean; composantes: Composante[]; mcuX: number; mcuY: number };
type ComposantePassage = { c: Composante; dc: TableHuffman | undefined; ac: TableHuffman | undefined };
type Passage = { composantes: ComposantePassage[]; ss: number; se: number; ah: number; bande: [number, number] };

const BLOCS_MAX = 1 << 20;
const PASSAGES_MAX = 32;
const BITS_RAPIDES = 9;

const lire16 = (o: Uint8Array, i: number) => (o[i] << 8) | o[i + 1];
const estRst = (marqueur: number) => marqueur >= 0xd0 && marqueur <= 0xd7;
const lireMarqueur = (o: Uint8Array, i: number) => (i + 1 < o.length && o[i] === 0xff && o[i + 1] !== 0x00 ? o[i + 1] : -1);

function lireTables(o: Uint8Array, debut: number, fin: number, tables: (TableHuffman | undefined)[]): boolean {
  let i = debut;
  while (i < fin) {
    if (i + 17 > fin) return false;
    const classe = o[i] >> 4;
    const numero = o[i] & 15;
    if (classe > 1 || numero > 3) return false;
    const maxcode = new Int32Array(17).fill(-1);
    const valptr = new Int32Array(17);
    const mincode = new Int32Array(17);
    let code = 0;
    let total = 0;
    for (let l = 1; l <= 16; l++) {
      const nombre = o[i + l];
      valptr[l] = total;
      mincode[l] = code;
      code += nombre;
      total += nombre;
      if (nombre > 0) {
        if (code >= 1 << l) return false;
        maxcode[l] = code - 1;
      }
      code <<= 1;
    }
    const valeurs = i + 17;
    if (total > 256 || valeurs + total > fin || (classe === 0 && o.subarray(valeurs, valeurs + total).some((s) => s > 15))) return false;
    const rapide = new Uint16Array(1 << BITS_RAPIDES);
    for (let l = 1; l <= BITS_RAPIDES; l++) {
      for (let motif = mincode[l]; motif <= maxcode[l]; motif++) {
        const symbole = o[valeurs + valptr[l] + motif - mincode[l]];
        rapide.fill((l << 8) | symbole, motif << (BITS_RAPIDES - l), (motif + 1) << (BITS_RAPIDES - l));
      }
    }
    tables[classe * 4 + numero] = { maxcode, valptr, mincode, valeurs: o.subarray(valeurs, valeurs + total), rapide };
    i = valeurs + total;
  }
  return true;
}

function lireImage(o: Uint8Array, debut: number, fin: number, progressive: boolean): Image | null {
  if (fin - debut < 6) return null;
  const hauteur = lire16(o, debut + 1);
  const largeur = lire16(o, debut + 3);
  const nombre = o[debut + 5];
  if (hauteur === 0 || largeur === 0 || nombre < 1 || nombre > 4 || fin - debut !== 6 + 3 * nombre) return null;
  const facteurs: { id: number; h: number; v: number }[] = [];
  for (let k = 0; k < nombre; k++) {
    const j = debut + 6 + 3 * k;
    const h = o[j + 1] >> 4;
    const v = o[j + 1] & 15;
    if (h < 1 || h > 4 || v < 1 || v > 4) return null;
    facteurs.push({ id: o[j], h, v });
  }
  const hmax = Math.max(...facteurs.map((f) => f.h));
  const vmax = Math.max(...facteurs.map((f) => f.v));
  const composantes = facteurs.map((f) => ({
    ...f,
    largeur: Math.ceil(Math.ceil((largeur * f.h) / hmax) / 8),
    hauteur: Math.ceil(Math.ceil((hauteur * f.v) / vmax) / 8),
    nonNuls: null,
  }));
  return { progressive, composantes, mcuX: Math.ceil(largeur / (8 * hmax)), mcuY: Math.ceil(hauteur / (8 * vmax)) };
}

function masquerBande(de: number, a: number, mot: number): number {
  let masque = 0;
  for (let k = Math.max(de, mot * 32); k <= Math.min(a, mot * 32 + 31); k++) masque |= 1 << (k & 31);
  return masque;
}

function lirePassage(o: Uint8Array, debut: number, fin: number, image: Image, tables: (TableHuffman | undefined)[]): Passage | null {
  const nombre = o[debut];
  if (nombre < 1 || nombre > 4 || fin - debut !== 4 + 2 * nombre) return null;
  const composantes: ComposantePassage[] = [];
  for (let k = 0; k < nombre; k++) {
    const j = debut + 1 + 2 * k;
    const c = image.composantes.find((x) => x.id === o[j]);
    if (!c) return null;
    composantes.push({ c, dc: tables[o[j + 1] >> 4], ac: tables[4 + (o[j + 1] & 15)] });
  }
  const k = debut + 1 + 2 * nombre;
  const ss = o[k];
  const se = o[k + 1];
  const bande: [number, number] = [masquerBande(ss, se, 0), masquerBande(ss, se, 1)];
  const passage = { composantes, ss, se, ah: o[k + 2] >> 4, bande };
  const dc = !image.progressive || (passage.ss === 0 && passage.ah === 0);
  const ac = !image.progressive || passage.ss > 0;
  if (composantes.some((p) => (dc && !p.dc) || (ac && !p.ac))) return null;
  if (!image.progressive) return passage;
  if (passage.se > 63 || passage.ss > passage.se || (passage.ss === 0 ? passage.se !== 0 : nombre !== 1)) return null;
  if (passage.ss > 0 && !composantes[0].c.nonNuls) {
    const blocs = composantes[0].c.largeur * composantes[0].c.hauteur;
    if (blocs > BLOCS_MAX) return null;
    composantes[0].c.nonNuls = new Uint32Array(blocs * 2);
  }
  return passage;
}

function parcourirPassage(o: Uint8Array, debut: number, image: Image, p: Passage, intervalle: number): number {
  let pos = debut;
  let acc = 0;
  let nb = 0;
  let faux = 0;
  let marqueurAtteint = false;
  let eobrun = 0;

  const remplir = () => {
    while (nb <= 16) {
      if (!marqueurAtteint && pos < o.length && (o[pos] !== 0xff || o[pos + 1] === 0x00)) {
        acc = (acc << 8) | o[pos];
        pos += o[pos] === 0xff ? 2 : 1;
      } else {
        marqueurAtteint = true;
        acc <<= 8;
        faux += 8;
      }
      nb += 8;
    }
  };
  const consommer = (nombre: number) => {
    nb -= nombre;
    acc &= (1 << nb) - 1;
  };
  const lireBits = (nombre: number): number => {
    if (nombre === 0) return 0;
    remplir();
    const valeur = (acc >>> (nb - nombre)) & ((1 << nombre) - 1);
    consommer(nombre);
    return valeur;
  };
  const lireBit = () => lireBits(1);
  const decoder = (t: TableHuffman): number => {
    remplir();
    const rapide = t.rapide[(acc >>> (nb - BITS_RAPIDES)) & ((1 << BITS_RAPIDES) - 1)];
    if (rapide !== 0) {
      consommer(rapide >> 8);
      return rapide & 0xff;
    }
    for (let l = BITS_RAPIDES + 1; l <= 16; l++) {
      const code = (acc >>> (nb - l)) & ((1 << l) - 1);
      if (code <= t.maxcode[l]) {
        consommer(l);
        return t.valeurs[t.valptr[l] + code - t.mincode[l]];
      }
    }
    return -1;
  };
  const epuise = () => nb < faux;
  const trouverMarqueur = (): number => {
    while (o[pos] === 0xff && o[pos + 1] === 0xff) pos += 1;
    return lireMarqueur(o, pos);
  };
  const finirIntervalle = (): number => {
    if (nb - faux >= 8) return -1;
    acc = 0;
    nb = 0;
    faux = 0;
    marqueurAtteint = false;
    return trouverMarqueur();
  };
  const estNonNul = (nonNuls: Uint32Array, bloc: number, k: number) => (nonNuls[bloc * 2 + (k >> 5)] & (1 << (k & 31))) !== 0;
  const marquer = (nonNuls: Uint32Array, bloc: number, k: number) => {
    nonNuls[bloc * 2 + (k >> 5)] |= 1 << (k & 31);
  };

  const lireDc = (t: TableHuffman): boolean => {
    const s = decoder(t);
    if (s < 0) return false;
    lireBits(s);
    return true;
  };
  const lireSequentiel = (cp: ComposantePassage): boolean => {
    if (!lireDc(cp.dc!)) return false;
    for (let k = 1; k < 64; ) {
      const rs = decoder(cp.ac!);
      if (rs < 0) return false;
      if ((rs & 15) === 0) {
        if (rs >> 4 !== 15) break;
        k += 16;
      } else {
        k += (rs >> 4) + 1;
        lireBits(rs & 15);
      }
    }
    return true;
  };
  const lireAcPremier = (cp: ComposantePassage, bloc: number): boolean => {
    if (eobrun > 0) {
      eobrun -= 1;
      return true;
    }
    for (let k = p.ss; k <= p.se; ) {
      const rs = decoder(cp.ac!);
      if (rs < 0) return false;
      const r = rs >> 4;
      if ((rs & 15) === 0) {
        if (r < 15) {
          eobrun = (1 << r) - 1 + lireBits(r);
          break;
        }
        k += 16;
      } else {
        k += r;
        if (k > p.se) return false;
        lireBits(rs & 15);
        marquer(cp.c.nonNuls!, bloc, k);
        k += 1;
      }
    }
    return true;
  };
  const lireAcAffine = (cp: ComposantePassage, bloc: number): boolean => {
    const nonNuls = cp.c.nonNuls!;
    let k = p.ss;
    if (eobrun === 0) {
      for (; k <= p.se; k++) {
        const rs = decoder(cp.ac!);
        if (rs < 0) return false;
        let r = rs >> 4;
        const s = rs & 15;
        if (s !== 0) lireBit();
        else if (r !== 15) {
          eobrun = (1 << r) + lireBits(r);
          break;
        }
        do {
          if (estNonNul(nonNuls, bloc, k)) lireBit();
          else if (--r < 0) break;
          k += 1;
        } while (k <= p.se);
        if (s !== 0 && k <= p.se) marquer(nonNuls, bloc, k);
      }
    }
    if (eobrun > 0 && k === p.ss) {
      for (let mot = 0; mot < 2; mot++) {
        for (let bits = nonNuls[bloc * 2 + mot] & p.bande[mot]; bits !== 0; bits &= bits - 1) lireBit();
      }
      eobrun -= 1;
    } else if (eobrun > 0) {
      for (; k <= p.se; k++) if (estNonNul(nonNuls, bloc, k)) lireBit();
      eobrun -= 1;
    }
    return true;
  };
  const lireBloc = (cp: ComposantePassage, bloc: number): boolean => {
    if (!image.progressive) return lireSequentiel(cp);
    if (p.ss > 0) return p.ah === 0 ? lireAcPremier(cp, bloc) : lireAcAffine(cp, bloc);
    if (p.ah === 0) return lireDc(cp.dc!);
    lireBit();
    return true;
  };

  const seule = p.composantes[0];
  const unites = p.composantes.length > 1 ? image.mcuX * image.mcuY : seule.c.largeur * seule.c.hauteur;
  let complet = true;
  for (let m = 0; m < unites && complet; m++) {
    if (intervalle > 0 && m > 0 && m % intervalle === 0) {
      const marqueur = finirIntervalle();
      if (marqueur < 0) return -1;
      if (!estRst(marqueur)) return pos;
      pos += 2;
      eobrun = 0;
    }
    let lu = true;
    if (p.composantes.length === 1) lu = lireBloc(seule, m);
    else {
      for (const cp of p.composantes) {
        for (let b = 0; b < cp.c.h * cp.c.v && lu; b++) lu = lireBloc(cp, -1);
      }
    }
    complet = lu && !epuise();
  }
  for (;;) {
    const marqueur = complet ? finirIntervalle() : trouverMarqueur();
    if (marqueur < 0) return -1;
    if (!estRst(marqueur)) return pos;
    pos += 2;
  }
}

export function verifierPassagesJpeg(o: Uint8Array): boolean {
  const tables: (TableHuffman | undefined)[] = [];
  let image: Image | null = null;
  let intervalle = 0;
  let passages = 0;
  let i = 2;
  for (;;) {
    if (i + 2 > o.length || o[i] !== 0xff) return false;
    const marqueur = o[i + 1];
    if (marqueur === 0xd9) return image !== null;
    if (i + 4 > o.length) return false;
    const fin = i + 2 + lire16(o, i + 2);
    if (fin > o.length) return false;
    if (marqueur === 0xc4) {
      if (!lireTables(o, i + 4, fin, tables)) return false;
    } else if (marqueur === 0xdd) {
      if (fin - i !== 6) return false;
      intervalle = lire16(o, i + 4);
    } else if (marqueur >= 0xc0 && marqueur <= 0xcf && marqueur !== 0xc8 && marqueur !== 0xcc) {
      if (image || marqueur > 0xc2) return false;
      image = lireImage(o, i + 4, fin, marqueur === 0xc2);
      if (!image) return false;
    } else if (marqueur === 0xda) {
      const passage = image ? lirePassage(o, i + 4, fin, image, tables) : null;
      passages += 1;
      if (!image || !passage || passages > PASSAGES_MAX) return false;
      const suite = parcourirPassage(o, fin, image, passage, intervalle);
      if (suite < 0) return false;
      i = suite;
      continue;
    }
    i = fin;
  }
}
