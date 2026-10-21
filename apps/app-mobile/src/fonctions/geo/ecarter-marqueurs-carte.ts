import {
  DEMI_CADRE_LIEU_POINTS,
  DEPLACEMENT_MAX_BULLE_POINTS,
  DIAMETRE_GROSSE_BULLE_POINTS,
  DIAMETRE_MARQUEUR_POINTS,
  ECART_FIXE_POINTS,
  ECART_MARQUEURS_POINTS,
  NOMBRE_GROSSE_BULLE,
  PORTEE_LIEUX_BULLE_POINTS,
  type EchelleCarte,
  type GroupeCarte,
  type LieuSeulCarte,
  type PlaceEcran,
} from "~/contenus/regroupement-carte";
import { relacherMarqueursCarte } from "~/fonctions/geo/relacher-marqueurs-carte";

const DIRECTIONS = 16;
const PAS_RECHERCHE = 4;
const PART_LIBRE = 0.9;
const PART_DEPLACEMENT = 0.4;
const MARGE_FIXE = 0.5;
const PAS_ECHANTILLON = 3;
const PART_CACHEE_MAX = 0.35;

type Position = { latitude: number; longitude: number };

type Choix = { x: number; y: number; fixe: number; libre: number };

type MarqueursEcartes = { groupes: GroupeCarte[]; seuls: LieuSeulCarte[] };

function ecartFixeMin(obstacles: PlaceEcran[], x: number, y: number): number {
  let min = Infinity;
  for (const o of obstacles) {
    const ecart = Math.max(Math.abs(o.x - x), Math.abs(o.y - y));
    if (ecart < min) min = ecart;
  }
  return min;
}

function distanceMin(voisins: PlaceEcran[], x: number, y: number): number {
  let min = Infinity;
  for (const v of voisins) {
    const carre = (v.x - x) * (v.x - x) + (v.y - y) * (v.y - y);
    if (carre < min) min = carre;
  }
  return Math.sqrt(min);
}

function creerCouverture(membres: PlaceEcran[], ici: PlaceEcran): (x: number, y: number) => boolean {
  if (membres.length === 0) return () => true;
  const portee = Math.max(PORTEE_LIEUX_BULLE_POINTS, distanceMin(membres, ici.x, ici.y)) + 1e-6;
  const porteeCarre = portee * portee;
  const demi = Math.ceil((DEPLACEMENT_MAX_BULLE_POINTS + portee) / portee) + 1;
  const cote = demi * 2 + 1;
  const caseDe = (x: number, y: number) => {
    const colonne = Math.floor((x - ici.x) / portee) + demi;
    const ligne = Math.floor((y - ici.y) / portee) + demi;
    return colonne < 0 || colonne >= cote || ligne < 0 || ligne >= cote ? -1 : colonne * cote + ligne;
  };
  const debuts = new Int32Array(cote * cote + 1);
  const cases = Int32Array.from(membres, (membre) => caseDe(membre.x, membre.y));
  for (const rang of cases) if (rang >= 0) debuts[rang + 1] += 1;
  for (let rang = 0; rang < cote * cote; rang++) debuts[rang + 1] += debuts[rang];
  const remplis = debuts.slice(0, cote * cote);
  const ordre = new Int32Array(debuts[cote * cote]);
  cases.forEach((rang, membre) => {
    if (rang >= 0) ordre[remplis[rang]++] = membre;
  });
  return (x, y) => {
    const colonne = Math.floor((x - ici.x) / portee) + demi;
    const ligne = Math.floor((y - ici.y) / portee) + demi;
    for (let c = Math.max(0, colonne - 1); c <= Math.min(cote - 1, colonne + 1); c++) {
      for (let l = Math.max(0, ligne - 1); l <= Math.min(cote - 1, ligne + 1); l++) {
        const rang = c * cote + l;
        for (let k = debuts[rang]; k < debuts[rang + 1]; k++) {
          const membre = membres[ordre[k]];
          if ((membre.x - x) * (membre.x - x) + (membre.y - y) * (membre.y - y) <= porteeCarre) return true;
        }
      }
    }
    return false;
  };
}

function calculerPartCachee(place: PlaceEcran, rayon: number, obstacles: PlaceEcran[]): number {
  const proches = obstacles.filter((o) => Math.max(Math.abs(o.x - place.x), Math.abs(o.y - place.y)) < DEMI_CADRE_LIEU_POINTS + rayon);
  if (proches.length === 0) return 0;
  let total = 0;
  let cachees = 0;
  for (let i = -PAS_ECHANTILLON; i <= PAS_ECHANTILLON; i++) {
    for (let j = -PAS_ECHANTILLON; j <= PAS_ECHANTILLON; j++) {
      if (i * i + j * j > PAS_ECHANTILLON * PAS_ECHANTILLON) continue;
      total += 1;
      if (ecartFixeMin(proches, place.x + (i / PAS_ECHANTILLON) * rayon, place.y + (j / PAS_ECHANTILLON) * rayon) < DEMI_CADRE_LIEU_POINTS) cachees += 1;
    }
  }
  return cachees / total;
}

function chercherPlace(ici: PlaceEcran, obstacles: PlaceEcran[], voisins: PlaceEcran[], couvre: (x: number, y: number) => boolean): Choix {
  let proche = obstacles[0];
  for (const o of obstacles) if (Math.hypot(o.x - ici.x, o.y - ici.y) < Math.hypot(proche.x - ici.x, proche.y - ici.y)) proche = o;
  const naturel = Math.hypot(ici.x - proche.x, ici.y - proche.y) > 0.5 ? Math.atan2(ici.y - proche.y, ici.x - proche.x) : -Math.PI / 2;
  const cosinus = new Float64Array(DIRECTIONS);
  const sinus = new Float64Array(DIRECTIONS);
  for (let pas = 0; pas < DIRECTIONS; pas++) {
    const angle = naturel + ((2 * Math.PI) / DIRECTIONS) * (pas % 2 === 0 ? pas / 2 : -(pas + 1) / 2);
    cosinus[pas] = Math.cos(angle);
    sinus[pas] = Math.sin(angle);
  }
  let meilleure: Choix = { x: ici.x, y: ici.y, fixe: Math.min(ecartFixeMin(obstacles, ici.x, ici.y), ECART_FIXE_POINTS), libre: distanceMin(voisins, ici.x, ici.y) };
  for (let distance = PAS_RECHERCHE; distance <= DEPLACEMENT_MAX_BULLE_POINTS; distance += PAS_RECHERCHE) {
    for (let pas = 0; pas < DIRECTIONS; pas++) {
      const x = ici.x + distance * cosinus[pas];
      const y = ici.y + distance * sinus[pas];
      const fixe = Math.min(ecartFixeMin(obstacles, x, y), ECART_FIXE_POINTS);
      if (fixe < meilleure.fixe || !couvre(x, y)) continue;
      const libre = distanceMin(voisins, x, y);
      if (fixe >= ECART_FIXE_POINTS - MARGE_FIXE && libre >= ECART_MARQUEURS_POINTS * PART_LIBRE) return { x, y, fixe, libre };
      if (fixe > meilleure.fixe || libre > meilleure.libre) meilleure = { x, y, fixe, libre };
    }
    if (meilleure.fixe >= ECART_FIXE_POINTS - MARGE_FIXE) return meilleure;
  }
  return meilleure;
}

export function ecarterMarqueursCarte(
  groupes: GroupeCarte[],
  fixes: LieuSeulCarte[],
  seuls: LieuSeulCarte[],
  echelle: EchelleCarte,
  lireMembres: (groupe: GroupeCarte) => Position[],
): MarqueursEcartes {
  if (groupes.length + seuls.length === 0) return { groupes, seuls };
  const versEcran = (p: Position): PlaceEcran => ({
    x: p.longitude / echelle.degresParPoint,
    y: -p.latitude / (echelle.degresParPoint * echelle.cosLatitude),
  });
  const obstacles = fixes.map(versEcran);
  const immobiles = seuls.map(versEcran);
  const places = groupes.map(versEcran);
  const poses = groupes.map(() => false);
  const devant = groupes.map(() => false);
  const portee = ECART_FIXE_POINTS + DEPLACEMENT_MAX_BULLE_POINTS;
  const pres = (a: PlaceEcran, b: PlaceEcran) => Math.abs(a.x - b.x) < portee && Math.abs(a.y - b.y) < portee;

  places.forEach((ici, rang) => {
    const proches = obstacles.filter((o) => pres(o, ici));
    if (proches.length === 0 || ecartFixeMin(proches, ici.x, ici.y) >= ECART_FIXE_POINTS) return;
    const voisins = immobiles.filter((immobile) => pres(immobile, ici));
    places.forEach((autre, rangAutre) => {
      if (rangAutre !== rang && pres(autre, ici)) voisins.push(autre);
    });
    const choix = chercherPlace(ici, proches, voisins, creerCouverture(lireMembres(groupes[rang]).map(versEcran), ici));
    places[rang] = { x: choix.x, y: choix.y };
    poses[rang] = true;
    devant[rang] = choix.fixe < ECART_FIXE_POINTS - MARGE_FIXE;
  });

  const diametre = (groupe: GroupeCarte) => (groupe.nombre >= NOMBRE_GROSSE_BULLE ? DIAMETRE_GROSSE_BULLE_POINTS : DIAMETRE_MARQUEUR_POINTS);
  const relachees = relacherMarqueursCarte(
    [
      ...places.map((place, rang) => ({ ...place, diametre: diametre(groupes[rang]), deplacementMax: poses[rang] ? 0 : ECART_MARQUEURS_POINTS * PART_DEPLACEMENT })),
      ...immobiles.map((place) => ({ ...place, diametre: DIAMETRE_MARQUEUR_POINTS, deplacementMax: DIAMETRE_MARQUEUR_POINTS / 2 })),
      ...obstacles.map((place) => ({ ...place, diametre: DIAMETRE_MARQUEUR_POINTS, deplacementMax: 0 })),
    ],
    (rang, avant, apres) =>
      rang >= groupes.length || obstacles.length === 0 || ecartFixeMin(obstacles, apres.x, apres.y) >= Math.min(ECART_FIXE_POINTS, ecartFixeMin(obstacles, avant.x, avant.y)),
  );
  const versCarte = ({ x, y }: PlaceEcran) => ({ longitude: x * echelle.degresParPoint, latitude: -y * echelle.degresParPoint * echelle.cosLatitude });
  const bouge = (avant: PlaceEcran, apres: PlaceEcran) => Math.abs(avant.x - apres.x) >= 1e-6 || Math.abs(avant.y - apres.y) >= 1e-6;

  return {
    groupes: groupes.map((groupe, rang) => {
      const place = relachees[rang];
      devant[rang] ||= obstacles.length > 0 && calculerPartCachee(place, diametre(groupe) / 2, obstacles) > PART_CACHEE_MAX;
      const deplace = bouge(versEcran(groupe), place);
      if (!deplace && !devant[rang]) return groupe;
      return { ...groupe, ...(deplace ? versCarte(place) : {}), ...(devant[rang] ? { devant: true } : {}) };
    }),
    seuls: seuls.map((seul, rang) => {
      const place = relachees[groupes.length + rang];
      return bouge(immobiles[rang], place) ? { id: seul.id, ...versCarte(place) } : seul;
    }),
  };
}
