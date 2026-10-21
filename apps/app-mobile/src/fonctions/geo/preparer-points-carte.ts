import type { PointCarte, PreparationCarte } from "~/contenus/regroupement-carte";

const LATITUDE_MAX = 85;
const CONTENUS_GARDES = 6;

type ContenuGarde = { points: PointCarte[]; preparation: PreparationCarte };

const parTableau = new WeakMap<PointCarte[], PreparationCarte>();
const parContenu: ContenuGarde[] = [];

export function preparerPointsCarte(points: PointCarte[]): PreparationCarte {
  const deja = parTableau.get(points);
  if (deja) return deja;
  const valides = trierParId(points.filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude)));
  const meme = parContenu.find((garde) => estMemeContenu(garde.points, valides));
  if (meme) {
    parTableau.set(points, meme.preparation);
    return meme.preparation;
  }
  const preparation: PreparationCarte = {
    projetes: valides.map((point) => ({ point, x: (point.longitude + 180) / 360, y: projeterLatitude(point.latitude) })),
    parNiveau: new Map(),
  };
  parContenu.unshift({ points: valides, preparation });
  if (parContenu.length > CONTENUS_GARDES) parContenu.pop();
  parTableau.set(points, preparation);
  return preparation;
}

function trierParId(points: PointCarte[]): PointCarte[] {
  const nombre = points.length;
  const cles = Float64Array.from(points, (point, rang) => point.id * nombre + rang).sort();
  return Array.from(cles, (cle) => points[cle - Math.floor(cle / nombre) * nombre]);
}

function projeterLatitude(latitude: number): number {
  const sinus = Math.sin((Math.max(-LATITUDE_MAX, Math.min(LATITUDE_MAX, latitude)) * Math.PI) / 180);
  return 0.5 - Math.log((1 + sinus) / (1 - sinus)) / (4 * Math.PI);
}

function estMemeContenu(gardes: PointCarte[], nouveaux: PointCarte[]): boolean {
  if (gardes.length !== nouveaux.length) return false;
  return gardes.every((garde, rang) => {
    const nouveau = nouveaux[rang];
    return garde.id === nouveau.id && garde.latitude === nouveau.latitude && garde.longitude === nouveau.longitude && garde.prioritaire === nouveau.prioritaire;
  });
}
