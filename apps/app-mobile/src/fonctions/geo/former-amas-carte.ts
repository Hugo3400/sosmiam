import type { AmasCarte, PointProjete } from "~/contenus/regroupement-carte";

const PASSES_FUSION = 6;

type Graine = { rang: number; nombre: number; sommeX: number; sommeY: number };

export function formerAmasCarte(projetes: PointProjete[], niveau: number): AmasCarte[] {
  const rayon = 2 ** -niveau;
  const decalage = 2 ** Math.ceil(niveau + 2);
  const { graines, amasDe } = semer(projetes, rayon, decalage);
  const parent = fusionner(graines, rayon, decalage);
  return finir(projetes, graines, amasDe, parent, niveau);
}

function semer(projetes: PointProjete[], rayon: number, decalage: number): { graines: Graine[]; amasDe: Int32Array } {
  const xs = Float64Array.from(projetes, (p) => p.x);
  const ys = Float64Array.from(projetes, (p) => p.y);
  const grille = quadriller(xs, ys, rayon, decalage);
  const rayonCarre = rayon * rayon;
  const amasDe = new Int32Array(projetes.length).fill(-1);
  const graines: Graine[] = [];
  for (let rang = 0; rang < projetes.length; rang++) {
    if (amasDe[rang] !== -1) continue;
    const graine = { rang, nombre: 0, sommeX: 0, sommeY: 0 };
    const colonne = Math.floor(xs[rang] / rayon);
    const ligne = Math.floor(ys[rang] / rayon);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const voisins = grille.get((colonne + dx) * decalage + ligne + dy);
        if (!voisins) continue;
        for (const voisin of voisins) {
          if (amasDe[voisin] !== -1) continue;
          const ecartX = xs[voisin] - xs[rang];
          const ecartY = ys[voisin] - ys[rang];
          if (ecartX * ecartX + ecartY * ecartY > rayonCarre) continue;
          amasDe[voisin] = graines.length;
          graine.nombre += 1;
          graine.sommeX += xs[voisin];
          graine.sommeY += ys[voisin];
        }
      }
    }
    graines.push(graine);
  }
  return { graines, amasDe };
}

function fusionner(graines: Graine[], rayon: number, decalage: number): Int32Array {
  const rayonCarre = rayon * rayon;
  const parent = Int32Array.from(graines, (_, rang) => rang);
  let actifs = graines.map((_, rang) => rang).sort((a, b) => graines[b].nombre - graines[a].nombre || a - b);
  for (let passe = 0; passe < PASSES_FUSION; passe++) {
    const xs = Float64Array.from(actifs, (rang) => graines[rang].sommeX / graines[rang].nombre);
    const ys = Float64Array.from(actifs, (rang) => graines[rang].sommeY / graines[rang].nombre);
    const grille = quadriller(xs, ys, rayon, decalage);
    const pris = new Uint8Array(actifs.length);
    let fusion = false;
    for (let place = 0; place < actifs.length; place++) {
      if (pris[place]) continue;
      pris[place] = 1;
      const base = graines[actifs[place]];
      const colonne = Math.floor(xs[place] / rayon);
      const ligne = Math.floor(ys[place] / rayon);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const voisins = grille.get((colonne + dx) * decalage + ligne + dy);
          if (!voisins) continue;
          for (const voisin of voisins) {
            if (pris[voisin]) continue;
            const ecartX = xs[voisin] - xs[place];
            const ecartY = ys[voisin] - ys[place];
            if (ecartX * ecartX + ecartY * ecartY > rayonCarre) continue;
            pris[voisin] = 1;
            const absorbee = graines[actifs[voisin]];
            parent[actifs[voisin]] = actifs[place];
            base.nombre += absorbee.nombre;
            base.sommeX += absorbee.sommeX;
            base.sommeY += absorbee.sommeY;
            fusion = true;
          }
        }
      }
    }
    actifs = actifs.filter((rang) => parent[rang] === rang);
    if (!fusion) break;
  }
  return parent;
}

function finir(projetes: PointProjete[], graines: Graine[], amasDe: Int32Array, parent: Int32Array, niveau: number): AmasCarte[] {
  const membresDe = new Map<number, PointProjete[]>();
  for (let rang = 0; rang < projetes.length; rang++) {
    let racine = amasDe[rang];
    while (parent[racine] !== racine) racine = parent[racine];
    const membres = membresDe.get(racine);
    if (membres) membres.push(projetes[rang]);
    else membresDe.set(racine, [projetes[rang]]);
  }
  const amas: AmasCarte[] = [];
  for (const [racine, membres] of membresDe) {
    let latitude = 0;
    let longitude = 0;
    let nord = -Infinity;
    let sud = Infinity;
    let ouest = Infinity;
    let est = -Infinity;
    for (const { point } of membres) {
      latitude += point.latitude;
      longitude += point.longitude;
      nord = Math.max(nord, point.latitude);
      sud = Math.min(sud, point.latitude);
      ouest = Math.min(ouest, point.longitude);
      est = Math.max(est, point.longitude);
    }
    const groupe = {
      cle: `${niveau}:${projetes[graines[racine].rang].point.id}`,
      nombre: membres.length,
      latitude: latitude / membres.length,
      longitude: longitude / membres.length,
      ids: membres.map(({ point }) => point.id),
    };
    amas.push({ membres, groupe, nord, sud, ouest, est });
  }
  return amas;
}

function quadriller(xs: Float64Array, ys: Float64Array, cote: number, decalage: number): Map<number, number[]> {
  const cases = new Map<number, number[]>();
  for (let rang = 0; rang < xs.length; rang++) {
    const cle = Math.floor(xs[rang] / cote) * decalage + Math.floor(ys[rang] / cote);
    const rangs = cases.get(cle);
    if (rangs) rangs.push(rang);
    else cases.set(cle, [rang]);
  }
  return cases;
}
