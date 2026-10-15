import {
  MARGE_VUE_CARTE,
  METRES_PAR_DEGRE,
  METRES_PAR_POINT_RUE,
  PLAFOND_MARQUEURS_CARTE,
  PLAFOND_PRIORITAIRES_CARTE,
  RAYON_GROUPE_POINTS,
  SEUIL_SANS_GROUPE_CARTE,
  type AmasCarte,
  type CarteRegroupee,
  type GroupeCarte,
  type LieuSeulCarte,
  type PointCarte,
  type PointProjete,
  type RegionCarte,
  type TailleCarte,
} from "~/contenus/regroupement-carte";
import { formerAmasCarte } from "~/fonctions/geo/former-amas-carte";

const LARGEUR_PAR_DEFAUT = 390;
const HAUTEUR_PAR_DEFAUT = 800;
const RAYON_ECART_POINTS = 22;
const DECIMALES_MEME_PLACE = 5;
const NIVEAU_MIN = 1;
const NIVEAU_MAX = 24;
const PAS_NIVEAU = 0.5;
const NIVEAUX_GARDES = 12;
const LATITUDE_MAX = 85;
const RAYONS_PAR_ZONE = 128;

type Echelle = { degresParPoint: number; cosLatitude: number; latitude: number; longitude: number };

type Regroupement = { seuls: PointCarte[]; groupes: GroupeCarte[] };

type Etage = { cote: number; parZone: Map<string, AmasCarte[]>; parId: Map<number, AmasCarte> };

type Preparation = { projetes: PointProjete[]; parNiveau: Map<number, Etage> };

type Rectangle = { ouest: number; est: number; nord: number; sud: number };

const preparations = new WeakMap<PointCarte[], Preparation>();

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
  const bornes: Rectangle = {
    ouest: region.longitude - demiLongitude,
    est: region.longitude + demiLongitude,
    nord: region.latitude + demiLatitude,
    sud: region.latitude - demiLatitude,
  };

  const preparation = preparer(points);
  let choisi: PointCarte | null = null;
  const prioritaires: PointCarte[] = [];
  const autres: PointCarte[] = [];
  for (const { point } of preparation.projetes) {
    if (point.id === selection) {
      choisi = point;
      continue;
    }
    if (!estDansBornes(point, bornes)) continue;
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
    const exclus = new Set(fixes.map((point) => point.id));
    const fenetre: Rectangle = {
      ouest: (bornes.ouest + 180) / 360,
      est: (bornes.est + 180) / 360,
      nord: projeterLatitude(bornes.nord),
      sud: projeterLatitude(bornes.sud),
    };
    regroupement = regrouperAuMeilleurNiveau(preparation, echelle, budget, exclus, fenetre, bornes);
  }

  return {
    seuls: ecarterMemesPlaces([...fixes, ...regroupement.seuls], echelle).sort((a, b) => a.id - b.id),
    groupes: regroupement.groupes.sort((a, b) => (a.cle < b.cle ? -1 : a.cle > b.cle ? 1 : 0)),
  };
}

function preparer(points: PointCarte[]): Preparation {
  const deja = preparations.get(points);
  if (deja) return deja;
  const projetes = points
    .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
    .map((point) => ({ point, x: (point.longitude + 180) / 360, y: projeterLatitude(point.latitude) }));
  const preparation = { projetes, parNiveau: new Map<number, Etage>() };
  preparations.set(points, preparation);
  return preparation;
}

function projeterLatitude(latitude: number): number {
  const sinus = Math.sin((Math.max(-LATITUDE_MAX, Math.min(LATITUDE_MAX, latitude)) * Math.PI) / 180);
  return 0.5 - Math.log((1 + sinus) / (1 - sinus)) / (4 * Math.PI);
}

function lireAmas(preparation: Preparation, niveau: number, fenetre: Rectangle): { amas: AmasCarte[]; parId: Map<number, AmasCarte> } {
  let etage = preparation.parNiveau.get(niveau);
  if (!etage) {
    if (preparation.parNiveau.size >= NIVEAUX_GARDES) preparation.parNiveau.clear();
    etage = { cote: 2 ** -niveau * RAYONS_PAR_ZONE, parZone: new Map(), parId: new Map() };
    preparation.parNiveau.set(niveau, etage);
  }
  const { cote, parZone, parId } = etage;
  const premiereColonne = Math.floor(fenetre.ouest / cote);
  const premiereLigne = Math.floor(fenetre.nord / cote);
  const colonnes = Math.floor(fenetre.est / cote) - premiereColonne + 1;
  const lignes = Math.floor(fenetre.sud / cote) - premiereLigne + 1;
  const cles = Array.from({ length: colonnes * lignes }, (_, rang) => `${premiereColonne + Math.floor(rang / lignes)}:${premiereLigne + (rang % lignes)}`);
  const manquantes = cles.map((cle) => (parZone.has(cle) ? null : ([] as PointProjete[])));
  if (manquantes.some(Boolean)) {
    for (const projete of preparation.projetes) {
      const colonne = Math.floor(projete.x / cote) - premiereColonne;
      const ligne = Math.floor(projete.y / cote) - premiereLigne;
      if (colonne < 0 || colonne >= colonnes || ligne < 0 || ligne >= lignes) continue;
      manquantes[colonne * lignes + ligne]?.push(projete);
    }
    manquantes.forEach((projetes, rang) => {
      if (!projetes) return;
      const formes = formerAmasCarte(
        projetes.sort((a, b) => a.point.id - b.point.id),
        niveau,
      );
      parZone.set(cles[rang], formes);
      for (const un of formes) for (const { point } of un.membres) parId.set(point.id, un);
    });
  }
  return { amas: cles.flatMap((cle) => parZone.get(cle) ?? []), parId };
}

function regrouperAuMeilleurNiveau(
  preparation: Preparation,
  echelle: Echelle,
  budget: number,
  exclus: Set<number>,
  fenetre: Rectangle,
  bornes: Rectangle,
): Regroupement {
  const ideal = Math.log2(360 / (RAYON_GROUPE_POINTS * echelle.degresParPoint));
  let niveau = Math.min(NIVEAU_MAX, Math.max(NIVEAU_MIN, Math.round(ideal / PAS_NIVEAU) * PAS_NIVEAU));
  for (;;) {
    const { amas, parId } = lireAmas(preparation, niveau, fenetre);
    const touches = new Set<AmasCarte>();
    for (const id of exclus) {
      const un = parId.get(id);
      if (un) touches.add(un);
    }
    const seuls: PointCarte[] = [];
    const groupes: GroupeCarte[] = [];
    for (const un of amas) {
      if (un.nord < bornes.sud || un.sud > bornes.nord || un.est < bornes.ouest || un.ouest > bornes.est) continue;
      const restants = touches.has(un) ? un.membres.filter(({ point }) => !exclus.has(point.id)) : un.membres;
      const entier = un.sud >= bornes.sud && un.nord <= bornes.nord && un.ouest >= bornes.ouest && un.est <= bornes.est;
      if (restants.length === 0 || (!entier && !restants.some(({ point }) => estDansBornes(point, bornes)))) continue;
      if (restants.length === 1) seuls.push(restants[0].point);
      else groupes.push(restants === un.membres ? un.groupe : former(un.groupe.cle, restants.map(({ point }) => point)));
    }
    if (seuls.length + groupes.length <= budget || niveau <= NIVEAU_MIN) return { seuls, groupes };
    niveau -= PAS_NIVEAU;
  }
}

function estDansBornes(point: PointCarte, bornes: Rectangle): boolean {
  return point.latitude >= bornes.sud && point.latitude <= bornes.nord && point.longitude >= bornes.ouest && point.longitude <= bornes.est;
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

function empilerMemesPlaces(points: PointCarte[]): Regroupement {
  const parPlace = new Map<string, PointCarte[]>();
  for (const point of points) {
    const cle = `place:${lirePlace(point)}`;
    const memePlace = parPlace.get(cle);
    if (memePlace) memePlace.push(point);
    else parPlace.set(cle, [point]);
  }
  const seuls: PointCarte[] = [];
  const groupes: GroupeCarte[] = [];
  for (const [cle, membres] of parPlace) {
    if (membres.length === 1) seuls.push(membres[0]);
    else groupes.push(former(cle, membres));
  }
  return { seuls, groupes };
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
