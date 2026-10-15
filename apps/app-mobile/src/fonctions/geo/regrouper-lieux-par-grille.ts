import {
  CELLULE_GROUPE_POINTS,
  MARGE_VUE_CARTE,
  METRES_PAR_DEGRE,
  METRES_PAR_POINT_RUE,
  PLAFOND_MARQUEURS_CARTE,
  PLAFOND_PRIORITAIRES_CARTE,
  SEUIL_SANS_GROUPE_CARTE,
  type CarteRegroupee,
  type GroupeCarte,
  type LieuSeulCarte,
  type PointCarte,
  type RegionCarte,
  type TailleCarte,
} from "~/contenus/regroupement-carte";

const LARGEUR_PAR_DEFAUT = 390;
const HAUTEUR_PAR_DEFAUT = 800;
const RAYON_ECART_POINTS = 22;
const DECIMALES_MEME_PLACE = 5;
const NIVEAU_MAX = 30;

type Echelle = { degresParPoint: number; cosLatitude: number; latitude: number; longitude: number };

type Regroupement = { seuls: PointCarte[]; groupes: GroupeCarte[] };

export function regrouperLieuxParGrille(points: PointCarte[], region: RegionCarte, taille: TailleCarte, selection: number | null): CarteRegroupee {
  const largeur = taille.largeur > 0 ? taille.largeur : LARGEUR_PAR_DEFAUT;
  const hauteur = taille.hauteur > 0 ? taille.hauteur : HAUTEUR_PAR_DEFAUT;
  const echelle: Echelle = {
    degresParPoint: Math.max(region.longitudeDelta, 1e-9) / largeur,
    cosLatitude: Math.max(Math.cos((region.latitude * Math.PI) / 180), 0.01),
    latitude: region.latitude,
    longitude: region.longitude,
  };
  const demiLongitude = region.longitudeDelta * (0.5 + MARGE_VUE_CARTE);
  const demiLatitude = Math.max(region.latitudeDelta, echelle.degresParPoint * echelle.cosLatitude * hauteur) * (0.5 + MARGE_VUE_CARTE);

  let choisi: PointCarte | null = null;
  const prioritaires: PointCarte[] = [];
  const autres: PointCarte[] = [];
  for (const point of points) {
    if (point.id === selection) {
      choisi = point;
      continue;
    }
    if (!(Math.abs(point.latitude - region.latitude) <= demiLatitude && Math.abs(point.longitude - region.longitude) <= demiLongitude)) continue;
    if (point.prioritaire) prioritaires.push(point);
    else autres.push(point);
  }

  const tete = choisi ? [choisi] : [];
  let enAvant = prioritaires;
  const placesEnAvant = PLAFOND_PRIORITAIRES_CARTE - tete.length;
  if (prioritaires.length > placesEnAvant) {
    const tries = trierParProximite(prioritaires, echelle);
    enAvant = tries.slice(0, placesEnAvant);
    autres.push(...tries.slice(placesEnAvant));
  }
  const fixes = [...tete, ...enAvant];
  const budget = PLAFOND_MARQUEURS_CARTE - fixes.length;
  const metresParPoint = echelle.degresParPoint * METRES_PAR_DEGRE * echelle.cosLatitude;

  let regroupement: Regroupement;
  if (metresParPoint <= METRES_PAR_POINT_RUE) {
    regroupement = { seuls: autres.length > budget ? trierParProximite(autres, echelle).slice(0, budget) : autres, groupes: [] };
  } else if (fixes.length + autres.length <= SEUIL_SANS_GROUPE_CARTE) {
    regroupement = empilerMemesPlaces(autres);
  } else {
    regroupement = regrouperAuMeilleurNiveau(autres, echelle, budget);
  }

  return {
    seuls: ecarterMemesPlaces([...fixes, ...regroupement.seuls], echelle).sort((a, b) => a.id - b.id),
    groupes: regroupement.groupes.sort((a, b) => (a.cle < b.cle ? -1 : a.cle > b.cle ? 1 : 0)),
  };
}

function lirePlace(point: PointCarte): string {
  return `${point.latitude.toFixed(DECIMALES_MEME_PLACE)}:${point.longitude.toFixed(DECIMALES_MEME_PLACE)}`;
}

function trierParProximite(points: PointCarte[], echelle: Echelle): PointCarte[] {
  const ecart = (p: PointCarte) => {
    const dx = p.longitude - echelle.longitude;
    const dy = (p.latitude - echelle.latitude) / echelle.cosLatitude;
    return dx * dx + dy * dy;
  };
  return points
    .map((point) => ({ point, ecart: ecart(point) }))
    .sort((a, b) => a.ecart - b.ecart || a.point.id - b.point.id)
    .map(({ point }) => point);
}

function former(cle: string, membres: PointCarte[]): GroupeCarte {
  const tries = [...membres].sort((a, b) => a.id - b.id);
  let latitude = 0;
  let longitude = 0;
  for (const membre of tries) {
    latitude += membre.latitude;
    longitude += membre.longitude;
  }
  return {
    cle,
    nombre: tries.length,
    latitude: latitude / tries.length,
    longitude: longitude / tries.length,
    ids: tries.map((membre) => membre.id),
  };
}

function rassembler(points: PointCarte[], lireCle: (point: PointCarte) => string): Regroupement {
  const cellules = new Map<string, PointCarte[]>();
  for (const point of points) {
    const cle = lireCle(point);
    const cellule = cellules.get(cle);
    if (cellule) cellule.push(point);
    else cellules.set(cle, [point]);
  }
  const seuls: PointCarte[] = [];
  const groupes: GroupeCarte[] = [];
  for (const [cle, membres] of cellules) {
    if (membres.length === 1) seuls.push(membres[0]);
    else groupes.push(former(cle, membres));
  }
  return { seuls, groupes };
}

function empilerMemesPlaces(points: PointCarte[]): Regroupement {
  return rassembler(points, (point) => `place:${lirePlace(point)}`);
}

function regrouperAuMeilleurNiveau(points: PointCarte[], echelle: Echelle, budget: number): Regroupement {
  const cote = CELLULE_GROUPE_POINTS * echelle.degresParPoint;
  let niveau = Math.min(NIVEAU_MAX, Math.max(1, Math.ceil(Math.log2(360 / cote))));
  for (;;) {
    const pas = 360 / 2 ** niveau;
    const auNiveau = niveau;
    const regroupement = rassembler(points, (point) => `${auNiveau}:${Math.floor(point.latitude / pas)}:${Math.floor(point.longitude / pas)}`);
    if (regroupement.seuls.length + regroupement.groupes.length <= budget || niveau <= 1) return regroupement;
    niveau -= 1;
  }
}

function ecarterMemesPlaces(points: PointCarte[], echelle: Echelle): LieuSeulCarte[] {
  const parPlace = new Map<string, PointCarte[]>();
  for (const point of points) {
    const place = lirePlace(point);
    const memePlace = parPlace.get(place);
    if (memePlace) memePlace.push(point);
    else parPlace.set(place, [point]);
  }
  const ecartes: LieuSeulCarte[] = [];
  for (const membres of parPlace.values()) {
    if (membres.length === 1) {
      ecartes.push({ id: membres[0].id, latitude: membres[0].latitude, longitude: membres[0].longitude });
      continue;
    }
    const rayon = RAYON_ECART_POINTS / Math.sin(Math.PI / membres.length);
    [...membres]
      .sort((a, b) => a.id - b.id)
      .forEach((membre, rang) => {
        const angle = Math.PI / 2 + (2 * Math.PI * rang) / membres.length;
        ecartes.push({
          id: membre.id,
          latitude: membre.latitude + rayon * Math.sin(angle) * echelle.degresParPoint * echelle.cosLatitude,
          longitude: membre.longitude + rayon * Math.cos(angle) * echelle.degresParPoint,
        });
      });
  }
  return ecartes;
}
