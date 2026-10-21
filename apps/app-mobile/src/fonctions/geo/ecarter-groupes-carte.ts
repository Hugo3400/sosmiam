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
const PART_CACHEE_MAX = 0.5;

type Position = { latitude: number; longitude: number };

type Choix = { place: PlaceEcran; fixe: number; libre: number };

const ecartCarre = (a: PlaceEcran, b: PlaceEcran) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

function plusPres(parmi: PlaceEcran[], ici: PlaceEcran, ecart: (a: PlaceEcran, b: PlaceEcran) => number): number {
  let min = Infinity;
  for (const autre of parmi) min = Math.min(min, ecart(autre, ici));
  return min;
}

function creerCouverture(membres: PlaceEcran[], ici: PlaceEcran): (place: PlaceEcran) => boolean {
  if (membres.length === 0) return () => true;
  const portee = Math.max(PORTEE_LIEUX_BULLE_POINTS, plusPres(membres, ici, (a, b) => Math.hypot(a.x - b.x, a.y - b.y))) + 1e-6;
  const demi = Math.ceil((DEPLACEMENT_MAX_BULLE_POINTS + portee) / portee) + 1;
  const cote = demi * 2 + 1;
  const cases: PlaceEcran[][] = Array.from({ length: cote * cote }, () => []);
  const caseDe = (place: PlaceEcran) => {
    const colonne = Math.floor((place.x - ici.x) / portee) + demi;
    const ligne = Math.floor((place.y - ici.y) / portee) + demi;
    return colonne < 0 || colonne >= cote || ligne < 0 || ligne >= cote ? -1 : colonne * cote + ligne;
  };
  for (const membre of membres) {
    const rang = caseDe(membre);
    if (rang >= 0) cases[rang].push(membre);
  }
  return (place) => {
    const colonne = Math.floor((place.x - ici.x) / portee) + demi;
    const ligne = Math.floor((place.y - ici.y) / portee) + demi;
    for (let c = Math.max(0, colonne - 1); c <= Math.min(cote - 1, colonne + 1); c++) {
      for (let l = Math.max(0, ligne - 1); l <= Math.min(cote - 1, ligne + 1); l++) {
        for (const membre of cases[c * cote + l]) if (Math.hypot(membre.x - place.x, membre.y - place.y) <= portee) return true;
      }
    }
    return false;
  };
}

function calculerPartCachee(place: PlaceEcran, rayon: number, obstacles: PlaceEcran[]): number {
  const proches = obstacles.filter((o) => ecartCarre(o, place) < DEMI_CADRE_LIEU_POINTS + rayon);
  if (proches.length === 0) return 0;
  let total = 0;
  let cachees = 0;
  for (let i = -PAS_ECHANTILLON; i <= PAS_ECHANTILLON; i++) {
    for (let j = -PAS_ECHANTILLON; j <= PAS_ECHANTILLON; j++) {
      if (i * i + j * j > PAS_ECHANTILLON * PAS_ECHANTILLON) continue;
      const point = { x: place.x + (i / PAS_ECHANTILLON) * rayon, y: place.y + (j / PAS_ECHANTILLON) * rayon };
      total += 1;
      if (proches.some((o) => ecartCarre(o, point) < DEMI_CADRE_LIEU_POINTS)) cachees += 1;
    }
  }
  return cachees / total;
}

function chercherPlace(ici: PlaceEcran, obstacles: PlaceEcran[], voisins: PlaceEcran[], couvre: (place: PlaceEcran) => boolean): Choix {
  const proche = obstacles.reduce((a, b) => (Math.hypot(b.x - ici.x, b.y - ici.y) < Math.hypot(a.x - ici.x, a.y - ici.y) ? b : a));
  const naturel = Math.hypot(ici.x - proche.x, ici.y - proche.y) > 0.5 ? Math.atan2(ici.y - proche.y, ici.x - proche.x) : -Math.PI / 2;
  const directions = Array.from({ length: DIRECTIONS }, (_, pas) => {
    const angle = naturel + ((2 * Math.PI) / DIRECTIONS) * (pas % 2 === 0 ? pas / 2 : -(pas + 1) / 2);
    return { x: Math.cos(angle), y: Math.sin(angle) };
  });
  const libreA = (place: PlaceEcran) => plusPres(voisins, place, (a, b) => Math.hypot(a.x - b.x, a.y - b.y));
  let meilleure: Choix = { place: ici, fixe: Math.min(plusPres(obstacles, ici, ecartCarre), ECART_FIXE_POINTS), libre: libreA(ici) };
  for (let distance = PAS_RECHERCHE; distance <= DEPLACEMENT_MAX_BULLE_POINTS; distance += PAS_RECHERCHE) {
    for (const direction of directions) {
      const place = { x: ici.x + distance * direction.x, y: ici.y + distance * direction.y };
      const fixe = Math.min(plusPres(obstacles, place, ecartCarre), ECART_FIXE_POINTS);
      if (fixe < meilleure.fixe || !couvre(place)) continue;
      const libre = libreA(place);
      if (fixe >= ECART_FIXE_POINTS - MARGE_FIXE && libre >= ECART_MARQUEURS_POINTS * PART_LIBRE) return { place, fixe, libre };
      if (fixe > meilleure.fixe || libre > meilleure.libre) meilleure = { place, fixe, libre };
    }
    if (meilleure.fixe >= ECART_FIXE_POINTS - MARGE_FIXE) return meilleure;
  }
  return meilleure;
}

export function ecarterGroupesCarte(
  groupes: GroupeCarte[],
  fixes: LieuSeulCarte[],
  seuls: LieuSeulCarte[],
  echelle: EchelleCarte,
  lireMembres: (groupe: GroupeCarte) => Position[],
): GroupeCarte[] {
  if (groupes.length === 0) return groupes;
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

  places.forEach((ici, rang) => {
    const proches = obstacles.filter((o) => ecartCarre(o, ici) < portee);
    if (proches.length === 0 || plusPres(proches, ici, ecartCarre) >= ECART_FIXE_POINTS) return;
    const voisins: PlaceEcran[] = [];
    for (const immobile of immobiles) if (ecartCarre(immobile, ici) < portee) voisins.push(immobile);
    places.forEach((autre, rangAutre) => {
      if (rangAutre !== rang && ecartCarre(autre, ici) < portee) voisins.push(autre);
    });
    const choix = chercherPlace(ici, proches, voisins, creerCouverture(lireMembres(groupes[rang]).map(versEcran), ici));
    places[rang] = choix.place;
    poses[rang] = true;
    devant[rang] = choix.fixe < ECART_FIXE_POINTS - MARGE_FIXE;
  });

  const diametre = (groupe: GroupeCarte) => (groupe.nombre >= NOMBRE_GROSSE_BULLE ? DIAMETRE_GROSSE_BULLE_POINTS : DIAMETRE_MARQUEUR_POINTS);
  const relachees = relacherMarqueursCarte(
    [
      ...places.map((place, rang) => ({ ...place, diametre: diametre(groupes[rang]), mobile: !poses[rang] })),
      ...immobiles.map((place) => ({ ...place, diametre: DIAMETRE_MARQUEUR_POINTS, mobile: false })),
    ],
    ECART_MARQUEURS_POINTS * PART_DEPLACEMENT,
    (_, avant, apres) => obstacles.length === 0 || plusPres(obstacles, apres, ecartCarre) >= Math.min(ECART_FIXE_POINTS, plusPres(obstacles, avant, ecartCarre)),
  );

  return groupes.map((groupe, rang) => {
    const avant = versEcran(groupe);
    const place = relachees[rang];
    devant[rang] ||= obstacles.length > 0 && calculerPartCachee(place, diametre(groupe) / 2, obstacles) > PART_CACHEE_MAX;
    const bouge = Math.abs(avant.x - place.x) >= 1e-6 || Math.abs(avant.y - place.y) >= 1e-6;
    if (!bouge && !devant[rang]) return groupe;
    const deplace = bouge ? { longitude: place.x * echelle.degresParPoint, latitude: -place.y * echelle.degresParPoint * echelle.cosLatitude } : {};
    return { ...groupe, ...deplace, ...(devant[rang] ? { devant: true } : {}) };
  });
}
