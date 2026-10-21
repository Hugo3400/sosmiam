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
const PAS_RECHERCHE = 6;
const PART_LIBRE = 0.9;
const PART_DEPLACEMENT = 0.4;
const MARGE_FIXE = 0.5;
const PAS_ECHANTILLON = 3;
const PART_CACHEE_MAX = 0.35;
const MEMBRES_ECHANTILLON = 64;
const PART_SUPERPOSEE = 0.6;

type Position = { latitude: number; longitude: number };

type Choix = { x: number; y: number; fixe: number; libre: number };

type MarqueursEcartes = { groupes: GroupeCarte[]; seuls: LieuSeulCarte[] };

function sansDoublons(places: PlaceEcran[]): PlaceEcran[] {
  const vues = new Set<string>();
  return places.filter(({ x, y }) => {
    const cle = `${Math.round(x)}:${Math.round(y)}`;
    if (vues.has(cle)) return false;
    vues.add(cle);
    return true;
  });
}

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

function creerCouverture(tous: PlaceEcran[], ici: PlaceEcran): (x: number, y: number) => boolean {
  if (tous.length === 0) return () => true;
  const pas = Math.ceil(tous.length / MEMBRES_ECHANTILLON);
  const membres = pas > 1 ? tous.filter((_, rang) => rang % pas === 0) : tous;
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

function chercherPlace(ici: PlaceEcran, obstacles: PlaceEcran[], voisins: PlaceEcran[], couvre: (x: number, y: number) => boolean, choisi: PlaceEcran | null): Choix {
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
  const libreMin = ECART_MARQUEURS_POINTS * PART_LIBRE;
  const loinDuChoix = (c: Choix) => !choisi || Math.max(Math.abs(c.x - choisi.x), Math.abs(c.y - choisi.y)) >= ECART_FIXE_POINTS - MARGE_FIXE;
  const meilleurQue = (a: Choix, b: Choix) => {
    if (loinDuChoix(a) !== loinDuChoix(b)) return loinDuChoix(a);
    if (a.libre >= libreMin !== b.libre >= libreMin) return a.libre >= libreMin;
    return a.fixe !== b.fixe ? a.fixe > b.fixe : a.libre > b.libre;
  };
  let meilleure: Choix = { x: ici.x, y: ici.y, fixe: Math.min(ecartFixeMin(obstacles, ici.x, ici.y), ECART_FIXE_POINTS), libre: distanceMin(voisins, ici.x, ici.y) };
  for (let distance = PAS_RECHERCHE; distance <= DEPLACEMENT_MAX_BULLE_POINTS; distance += PAS_RECHERCHE) {
    for (let pas = 0; pas < DIRECTIONS; pas++) {
      const x = ici.x + distance * cosinus[pas];
      const y = ici.y + distance * sinus[pas];
      const choix = { x, y, fixe: Math.min(ecartFixeMin(obstacles, x, y), ECART_FIXE_POINTS), libre: distanceMin(voisins, x, y) };
      if (!meilleurQue(choix, meilleure) || !couvre(x, y)) continue;
      if (choix.fixe >= ECART_FIXE_POINTS - MARGE_FIXE && choix.libre >= libreMin) return choix;
      meilleure = choix;
    }
  }
  return meilleure;
}

function reunirBullesSuperposees(groupes: GroupeCarte[], places: PlaceEcran[], rayon: (groupe: GroupeCarte) => number): GroupeCarte[][] {
  const paires: { a: number; b: number; distance: number }[] = [];
  for (let a = 0; a < groupes.length; a++) {
    for (let b = a + 1; b < groupes.length; b++) {
      const distance = Math.hypot(places[a].x - places[b].x, places[a].y - places[b].y);
      if (distance < PART_SUPERPOSEE * (rayon(groupes[a]) + rayon(groupes[b]))) paires.push({ a, b, distance });
    }
  }
  const reunies = groupes.map((groupe) => [groupe]);
  paires.sort((p, q) => p.distance - q.distance || p.a - q.a || p.b - q.b);
  for (const { a, b } of paires) {
    if (reunies[a].length === 0 || reunies[b].length === 0) continue;
    const garde = groupes[a].nombre >= groupes[b].nombre ? a : b;
    const absorbee = garde === a ? b : a;
    reunies[garde].push(...reunies[absorbee]);
    reunies[absorbee] = [];
  }
  return reunies;
}

export function ecarterMarqueursCarte(
  groupes: GroupeCarte[],
  fixes: LieuSeulCarte[],
  seuls: LieuSeulCarte[],
  echelle: EchelleCarte,
  lireMembres: (groupe: GroupeCarte) => Position[],
  selection: number | null = null,
): MarqueursEcartes {
  if (groupes.length + seuls.length === 0) return { groupes, seuls };
  const versEcran = (p: Position): PlaceEcran => ({
    x: p.longitude / echelle.degresParPoint,
    y: -p.latitude / (echelle.degresParPoint * echelle.cosLatitude),
  });
  const obstacles = fixes.map(versEcran);
  const distincts = sansDoublons(obstacles);
  const lieuChoisi = fixes.find((fixe) => fixe.id === selection);
  const choisi = lieuChoisi ? versEcran(lieuChoisi) : null;
  const immobiles = seuls.map(versEcran);
  const barycentres = groupes.map(versEcran);
  const places = barycentres.map((place) => ({ ...place }));
  const couvertures = new Map<number, (x: number, y: number) => boolean>();
  const portee = ECART_FIXE_POINTS + DEPLACEMENT_MAX_BULLE_POINTS;
  const pres = (a: PlaceEcran, b: PlaceEcran) => Math.abs(a.x - b.x) < portee && Math.abs(a.y - b.y) < portee;

  for (let rang = 0; rang < places.length; rang++) {
    const ici = places[rang];
    const proches = distincts.filter((o) => pres(o, ici));
    if (proches.length === 0 || ecartFixeMin(proches, ici.x, ici.y) >= ECART_FIXE_POINTS) continue;
    const voisins = immobiles.filter((immobile) => pres(immobile, ici));
    places.forEach((autre, rangAutre) => {
      if (rangAutre !== rang && pres(autre, ici)) voisins.push(autre);
    });
    const couvre = creerCouverture(lireMembres(groupes[rang]).map(versEcran), ici);
    const choix = chercherPlace(ici, proches, voisins, couvre, choisi);
    places[rang] = { x: choix.x, y: choix.y };
    couvertures.set(rang, couvre);
  }

  const diametre = (groupe: GroupeCarte) => (groupe.nombre >= NOMBRE_GROSSE_BULLE ? DIAMETRE_GROSSE_BULLE_POINTS : DIAMETRE_MARQUEUR_POINTS);
  const prochesDe = barycentres.map((ancre) => distincts.filter((o) => Math.abs(o.x - ancre.x) < portee + DEPLACEMENT_MAX_BULLE_POINTS && Math.abs(o.y - ancre.y) < portee + DEPLACEMENT_MAX_BULLE_POINTS));
  const relachees = relacherMarqueursCarte(
    [
      ...places.map((place, rang) => ({
        ...place,
        diametre: diametre(groupes[rang]),
        deplacementMax: couvertures.has(rang) ? DEPLACEMENT_MAX_BULLE_POINTS : ECART_MARQUEURS_POINTS * PART_DEPLACEMENT,
        ancre: barycentres[rang],
      })),
      ...immobiles.map((place) => ({ ...place, diametre: DIAMETRE_MARQUEUR_POINTS, deplacementMax: DIAMETRE_MARQUEUR_POINTS / 2 })),
      ...distincts.map((place) => ({ ...place, diametre: DIAMETRE_MARQUEUR_POINTS, deplacementMax: 0 })),
    ],
    (rang, avant, apres) => {
      if (rang >= groupes.length) return true;
      const proches = prochesDe[rang];
      if (proches.length > 0 && ecartFixeMin(proches, apres.x, apres.y) < Math.min(ECART_FIXE_POINTS, ecartFixeMin(proches, avant.x, avant.y))) return false;
      const couvre = couvertures.get(rang);
      return couvre ? couvre(apres.x, apres.y) : true;
    },
  );
  const versCarte = ({ x, y }: PlaceEcran) => ({ longitude: x * echelle.degresParPoint, latitude: -y * echelle.degresParPoint * echelle.cosLatitude });
  const bouge = (avant: PlaceEcran, apres: PlaceEcran) => Math.abs(avant.x - apres.x) >= 1e-6 || Math.abs(avant.y - apres.y) >= 1e-6;

  const reunies = reunirBullesSuperposees(groupes, relachees, (groupe) => diametre(groupe) / 2);

  return {
    groupes: groupes.flatMap((premier, rang) => {
      if (reunies[rang].length === 0) return [];
      const place = relachees[rang];
      const groupe =
        reunies[rang].length === 1
          ? premier
          : { ...premier, nombre: reunies[rang].reduce((total, g) => total + g.nombre, 0), ids: reunies[rang].flatMap((g) => g.ids).sort((a, b) => a - b) };
      const devant = distincts.length > 0 && calculerPartCachee(place, diametre(groupe) / 2, distincts) > PART_CACHEE_MAX;
      const deplace = bouge(barycentres[rang], place);
      if (!deplace && !devant && groupe === premier) return [premier];
      return [{ ...groupe, ...(deplace ? versCarte(place) : {}), ...(devant ? { devant: true } : {}) }];
    }),
    seuls: seuls.map((seul, rang) => {
      const place = relachees[groupes.length + rang];
      return bouge(immobiles[rang], place) ? { id: seul.id, ...versCarte(place) } : seul;
    }),
  };
}
