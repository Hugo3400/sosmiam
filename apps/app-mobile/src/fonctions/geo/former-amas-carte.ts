import { ETENDUE_GROUPE_CARTE, type AmasCarte, type PointProjete } from "~/contenus/regroupement-carte";

const PART_RECHERCHE = 0.5;
const RECENTRAGES = 2;
const PASSES_FUSION = 6;
const CASES_MAX = 128;

type Grille = { minX: number; minY: number; cote: number; colonnes: number; lignes: number; tete: Int32Array; suivant: Int32Array; caseDe: Int32Array; compte: Int32Array };

type Tas = { graine: number; rangs: number[]; sommeX: number; sommeY: number; vivant: boolean };

export function formerAmasCarte(projetes: PointProjete[], niveau: number): AmasCarte[] {
  if (projetes.length === 0) return [];
  const ecart = 2 ** -niveau;
  const xs = new Float64Array(projetes.length);
  const ys = new Float64Array(projetes.length);
  for (let rang = 0; rang < projetes.length; rang++) {
    xs[rang] = projetes[rang].x;
    ys[rang] = projetes[rang].y;
  }
  const tas = semer(xs, ys, ecart * PART_RECHERCHE);
  fusionner(xs, ys, tas, ecart);
  const amas: AmasCarte[] = [];
  for (const un of tas) if (un.vivant) amas.push(finir(projetes, un, niveau));
  return amas;
}

function quadriller(xs: Float64Array, ys: Float64Array, nombre: number, cotePrefere: number): Grille {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let rang = 0; rang < nombre; rang++) {
    if (xs[rang] < minX) minX = xs[rang];
    if (ys[rang] < minY) minY = ys[rang];
    if (xs[rang] > maxX) maxX = xs[rang];
    if (ys[rang] > maxY) maxY = ys[rang];
  }
  const cote = Math.max(cotePrefere, (maxX - minX) / CASES_MAX, (maxY - minY) / CASES_MAX);
  const colonnes = Math.floor((maxX - minX) / cote) + 1;
  const lignes = Math.floor((maxY - minY) / cote) + 1;
  const tete = new Int32Array(colonnes * lignes).fill(-1);
  const compte = new Int32Array(colonnes * lignes);
  const suivant = new Int32Array(nombre);
  const caseDe = new Int32Array(nombre);
  for (let rang = nombre - 1; rang >= 0; rang--) {
    const colonne = Math.min(colonnes - 1, Math.floor((xs[rang] - minX) / cote));
    const indice = colonne * lignes + Math.min(lignes - 1, Math.floor((ys[rang] - minY) / cote));
    caseDe[rang] = indice;
    suivant[rang] = tete[indice];
    tete[indice] = rang;
    compte[indice] += 1;
  }
  return { minX, minY, cote, colonnes, lignes, tete, suivant, caseDe, compte };
}

function ordonner(grille: Grille, nombre: number): Int32Array {
  const { colonnes, lignes, caseDe, compte } = grille;
  const densites = new Int32Array(nombre);
  let densiteMax = 0;
  for (let rang = 0; rang < nombre; rang++) {
    const colonne = Math.floor(caseDe[rang] / lignes);
    const ligne = caseDe[rang] - colonne * lignes;
    const finColonne = colonne + 1 < colonnes ? colonne + 1 : colonnes - 1;
    const finLigne = ligne + 1 < lignes ? ligne + 1 : lignes - 1;
    let total = 0;
    for (let c = colonne > 0 ? colonne - 1 : 0; c <= finColonne; c++) {
      for (let l = ligne > 0 ? ligne - 1 : 0; l <= finLigne; l++) total += compte[c * lignes + l];
    }
    densites[rang] = total;
    if (total > densiteMax) densiteMax = total;
  }
  const cles = new Float64Array(nombre);
  for (let rang = 0; rang < nombre; rang++) cles[rang] = (densiteMax - densites[rang]) * nombre + rang;
  cles.sort();
  const ordre = new Int32Array(nombre);
  for (let i = 0; i < nombre; i++) ordre[i] = cles[i] % nombre;
  return ordre;
}

function semer(xs: Float64Array, ys: Float64Array, rayon: number): Tas[] {
  const grille = quadriller(xs, ys, xs.length, rayon);
  const rayonCarre = rayon * rayon;
  const amasDe = new Int32Array(xs.length).fill(-1);
  const tas: Tas[] = [];
  const ordre = ordonner(grille, xs.length);
  for (let i = 0; i < ordre.length; i++) {
    const graine = ordre[i];
    if (amasDe[graine] !== -1) continue;
    let centre = { x: xs[graine], y: ys[graine] };
    for (let fois = 0; fois < RECENTRAGES; fois++) {
      const suivant = centrer(grille, xs, ys, amasDe, centre, rayonCarre);
      if (!suivant) break;
      centre = suivant;
    }
    tas.push(ramasser(grille, xs, ys, amasDe, graine, centre, rayonCarre, tas.length));
  }
  return tas;
}

function centrer(grille: Grille, xs: Float64Array, ys: Float64Array, amasDe: Int32Array, { x, y }: { x: number; y: number }, rayonCarre: number) {
  const { minX, minY, cote, colonnes, lignes, tete, suivant } = grille;
  const colonne = Math.floor((x - minX) / cote);
  const ligne = Math.floor((y - minY) / cote);
  const finColonne = colonne + 1 < colonnes ? colonne + 1 : colonnes - 1;
  const finLigne = ligne + 1 < lignes ? ligne + 1 : lignes - 1;
  let sommeX = 0;
  let sommeY = 0;
  let compte = 0;
  for (let c = colonne > 0 ? colonne - 1 : 0; c <= finColonne; c++) {
    for (let l = ligne > 0 ? ligne - 1 : 0; l <= finLigne; l++) {
      for (let rang = tete[c * lignes + l]; rang !== -1; rang = suivant[rang]) {
        if (amasDe[rang] !== -1) continue;
        const dx = xs[rang] - x;
        const dy = ys[rang] - y;
        if (dx * dx + dy * dy > rayonCarre) continue;
        sommeX += xs[rang];
        sommeY += ys[rang];
        compte += 1;
      }
    }
  }
  return compte > 0 ? { x: sommeX / compte, y: sommeY / compte } : null;
}

function ramasser(grille: Grille, xs: Float64Array, ys: Float64Array, amasDe: Int32Array, graine: number, { x, y }: { x: number; y: number }, rayonCarre: number, numero: number): Tas {
  const { minX, minY, cote, colonnes, lignes, tete, suivant } = grille;
  const un: Tas = { graine, rangs: [graine], sommeX: xs[graine], sommeY: ys[graine], vivant: true };
  amasDe[graine] = numero;
  const colonne = Math.floor((x - minX) / cote);
  const ligne = Math.floor((y - minY) / cote);
  const finColonne = colonne + 1 < colonnes ? colonne + 1 : colonnes - 1;
  const finLigne = ligne + 1 < lignes ? ligne + 1 : lignes - 1;
  for (let c = colonne > 0 ? colonne - 1 : 0; c <= finColonne; c++) {
    for (let l = ligne > 0 ? ligne - 1 : 0; l <= finLigne; l++) {
      for (let rang = tete[c * lignes + l]; rang !== -1; rang = suivant[rang]) {
        if (amasDe[rang] !== -1) continue;
        const dx = xs[rang] - x;
        const dy = ys[rang] - y;
        if (dx * dx + dy * dy > rayonCarre) continue;
        amasDe[rang] = numero;
        un.rangs.push(rang);
        un.sommeX += xs[rang];
        un.sommeY += ys[rang];
      }
    }
  }
  return un;
}

function fusionner(xs: Float64Array, ys: Float64Array, tas: Tas[], ecart: number) {
  const ecartCarre = ecart * ecart;
  const etendueCarre = (ecart * ETENDUE_GROUPE_CARTE) ** 2;
  for (let passe = 0; passe < PASSES_FUSION; passe++) {
    const vivants = tas.filter((un) => un.vivant);
    const nombre = vivants.length;
    const cx = new Float64Array(nombre);
    const cy = new Float64Array(nombre);
    for (let rang = 0; rang < nombre; rang++) {
      cx[rang] = vivants[rang].sommeX / vivants[rang].rangs.length;
      cy[rang] = vivants[rang].sommeY / vivants[rang].rangs.length;
    }
    const { minX, minY, cote, colonnes, lignes, tete, suivant } = quadriller(cx, cy, nombre, ecart);
    const paires: { a: number; b: number; distance: number }[] = [];
    for (let a = 0; a < nombre; a++) {
      const colonne = Math.floor((cx[a] - minX) / cote);
      const ligne = Math.floor((cy[a] - minY) / cote);
      const finColonne = colonne + 1 < colonnes ? colonne + 1 : colonnes - 1;
      const finLigne = ligne + 1 < lignes ? ligne + 1 : lignes - 1;
      for (let c = colonne > 0 ? colonne - 1 : 0; c <= finColonne; c++) {
        for (let l = ligne > 0 ? ligne - 1 : 0; l <= finLigne; l++) {
          for (let b = tete[c * lignes + l]; b !== -1; b = suivant[b]) {
            if (b <= a) continue;
            const distance = (cx[a] - cx[b]) * (cx[a] - cx[b]) + (cy[a] - cy[b]) * (cy[a] - cy[b]);
            if (distance < ecartCarre) paires.push({ a, b, distance });
          }
        }
      }
    }
    if (paires.length === 0) return;
    paires.sort((p, q) => p.distance - q.distance || p.a - q.a || p.b - q.b);
    const pris = new Uint8Array(nombre);
    let fusion = false;
    for (const { a, b } of paires) {
      if (pris[a] || pris[b]) continue;
      const garde = vivants[a].rangs.length >= vivants[b].rangs.length ? vivants[a] : vivants[b];
      const absorbe = garde === vivants[a] ? vivants[b] : vivants[a];
      const total = garde.rangs.length + absorbe.rangs.length;
      const x = (garde.sommeX + absorbe.sommeX) / total;
      const y = (garde.sommeY + absorbe.sommeY) / total;
      if (depasse(garde.rangs, xs, ys, x, y, etendueCarre) || depasse(absorbe.rangs, xs, ys, x, y, etendueCarre)) continue;
      for (const rang of absorbe.rangs) garde.rangs.push(rang);
      garde.sommeX += absorbe.sommeX;
      garde.sommeY += absorbe.sommeY;
      absorbe.vivant = false;
      pris[a] = 1;
      pris[b] = 1;
      fusion = true;
    }
    if (!fusion) return;
  }
}

function depasse(rangs: number[], xs: Float64Array, ys: Float64Array, x: number, y: number, limiteCarre: number): boolean {
  for (const rang of rangs) {
    const dx = xs[rang] - x;
    const dy = ys[rang] - y;
    if (dx * dx + dy * dy > limiteCarre) return true;
  }
  return false;
}

function finir(projetes: PointProjete[], { graine, rangs }: Tas, niveau: number): AmasCarte {
  const tries = Int32Array.from(rangs).sort();
  const membres: PointProjete[] = [];
  const ids: number[] = [];
  let latitude = 0;
  let longitude = 0;
  let nord = -Infinity;
  let sud = Infinity;
  let ouest = Infinity;
  let est = -Infinity;
  for (const rang of tries) {
    const membre = projetes[rang];
    const { point } = membre;
    membres.push(membre);
    ids.push(point.id);
    latitude += point.latitude;
    longitude += point.longitude;
    if (point.latitude > nord) nord = point.latitude;
    if (point.latitude < sud) sud = point.latitude;
    if (point.longitude < ouest) ouest = point.longitude;
    if (point.longitude > est) est = point.longitude;
  }
  const groupe = { cle: `${niveau}:${projetes[graine].point.id}`, nombre: membres.length, latitude: latitude / membres.length, longitude: longitude / membres.length, ids };
  return { membres, groupe, nord, sud, ouest, est };
}
