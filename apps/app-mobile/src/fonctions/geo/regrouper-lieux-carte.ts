import {
  DEPLACEMENT_MAX_LIEU_RUE_POINTS,
  DIAMETRE_MARQUEUR_POINTS,
  ECART_MARQUEURS_POINTS,
  MARGE_VUE_CARTE,
  METRES_PAR_DEGRE,
  METRES_PAR_POINT_RUE,
  PLAFOND_MARQUEURS_CARTE,
  PLAFOND_PRIORITAIRES_CARTE,
  type AmasCarte,
  type CarteRegroupee,
  type EchelleCarte,
  type EtageCarte,
  type GroupeCarte,
  type LieuSeulCarte,
  type PointCarte,
  type PointProjete,
  type PreparationCarte,
  type RegionCarte,
  type TailleCarte,
} from "~/contenus/regroupement-carte";
import { ecarterGroupesCarte } from "~/fonctions/geo/ecarter-groupes-carte";
import { formerAmasCarte } from "~/fonctions/geo/former-amas-carte";
import { preparerPointsCarte } from "~/fonctions/geo/preparer-points-carte";
import { relacherMarqueursCarte } from "~/fonctions/geo/relacher-marqueurs-carte";

const LARGEUR_PAR_DEFAUT = 390;
const HAUTEUR_PAR_DEFAUT = 800;
const RAYON_ECART_POINTS = 22;
const DECIMALES_MEME_PLACE = 5;
const NIVEAU_MIN = 1;
const NIVEAU_MAX = 24;
const PAS_NIVEAU = 0.25;
const NIVEAUX_GARDES = 16;
const LATITUDE_MAX = 85;
const RAYONS_PAR_ZONE = 128;
const MARGES_RUE = [MARGE_VUE_CARTE, 0.15, 0.08, 0];
const FINESSE_RUE = 2;

type Regroupement = { seuls: PointCarte[]; groupes: GroupeCarte[] };

type Rectangle = { ouest: number; est: number; nord: number; sud: number };

export function regrouperLieuxCarte(points: PointCarte[], region: RegionCarte, taille: TailleCarte, selection: number | null): CarteRegroupee {
  const largeur = taille.largeur > 0 ? taille.largeur : LARGEUR_PAR_DEFAUT;
  const hauteur = taille.hauteur > 0 ? taille.hauteur : HAUTEUR_PAR_DEFAUT;
  const echelle: EchelleCarte = {
    degresParPoint: Math.max(region.longitudeDelta, 1e-9) / largeur,
    cosLatitude: Math.max(Math.cos((region.latitude * Math.PI) / 180), 0.01),
    latitude: region.latitude,
    longitude: region.longitude,
  };
  const hauteurVue = Math.max(region.latitudeDelta, echelle.degresParPoint * echelle.cosLatitude * hauteur);
  const fenetreAvec = (marge: number): Rectangle => ({
    ouest: region.longitude - region.longitudeDelta * (0.5 + marge),
    est: region.longitude + region.longitudeDelta * (0.5 + marge),
    nord: region.latitude + hauteurVue * (0.5 + marge),
    sud: region.latitude - hauteurVue * (0.5 + marge),
  });
  const bornes = fenetreAvec(MARGE_VUE_CARTE);

  const preparation = preparerPointsCarte(points);
  let choisi: PointCarte | null = null;
  const prioritaires: PointCarte[] = [];
  for (const { point } of preparation.projetes) {
    if (point.id === selection) choisi = point;
    else if (point.prioritaire && estDansBornes(point, bornes)) prioritaires.push(point);
  }

  const tete = choisi ? [choisi] : [];
  let enAvant = prioritaires;
  let surplus: PointCarte[] = [];
  const placesEnAvant = PLAFOND_PRIORITAIRES_CARTE - tete.length;
  if (prioritaires.length > placesEnAvant) {
    const tries = trierParProximite(prioritaires, echelle);
    enAvant = tries.slice(0, placesEnAvant);
    surplus = tries.slice(placesEnAvant).sort((a, b) => a.id - b.id);
  }
  const fixes = [...tete, ...enAvant];
  const budget = PLAFOND_MARQUEURS_CARTE - fixes.length;
  const metresParPoint = echelle.degresParPoint * METRES_PAR_DEGRE * echelle.cosLatitude;

  const rue = metresParPoint <= METRES_PAR_POINT_RUE;
  let marge = MARGE_VUE_CARTE;
  let regroupement: Regroupement | null = null;
  if (rue) {
    for (const essai of MARGES_RUE) {
      const fenetre = fenetreAvec(essai);
      const autres = preparation.projetes.flatMap(({ point }) => (!point.prioritaire && point.id !== selection && estDansBornes(point, fenetre) ? [point] : []));
      if (autres.length + surplus.length > budget) continue;
      regroupement = { seuls: [...autres, ...surplus], groupes: [] };
      marge = essai;
      break;
    }
  }
  const sansBulle = regroupement !== null;
  if (!regroupement) {
    if (rue) marge = 0;
    regroupement = regrouperAuMeilleurNiveau(preparation, echelle, budget, choisi?.id ?? null, fenetreAvec(marge), surplus, rue ? FINESSE_RUE : 0);
  }

  const ecartes = ecarterMemesPlaces([...fixes, ...regroupement.seuls], echelle);
  const idsObstacles = new Set([...fixes, ...surplus].map((point) => point.id));
  const obstacles = ecartes.filter((seul) => idsObstacles.has(seul.id));
  const autresSeuls = ecartes.filter((seul) => !idsObstacles.has(seul.id));
  const seuls = sansBulle ? [...obstacles, ...relacherLieuxRue(autresSeuls, obstacles, echelle)] : ecartes;
  const groupes = ecarterGroupesCarte(
    [...regroupement.groupes].sort((a, b) => (a.cle < b.cle ? -1 : a.cle > b.cle ? 1 : 0)),
    obstacles,
    autresSeuls,
    echelle,
    (groupe) => groupe.ids.flatMap((id) => trouverParId(preparation.projetes, id) ?? []),
  );
  return { seuls: seuls.sort((a, b) => a.id - b.id), groupes, marge };
}

function trouverParId(projetes: PointProjete[], id: number): PointCarte | null {
  let bas = 0;
  let haut = projetes.length - 1;
  while (bas <= haut) {
    const milieu = (bas + haut) >> 1;
    const ici = projetes[milieu].point.id;
    if (ici === id) return projetes[milieu].point;
    if (ici < id) bas = milieu + 1;
    else haut = milieu - 1;
  }
  return null;
}

function relacherLieuxRue(seuls: LieuSeulCarte[], fixes: LieuSeulCarte[], echelle: EchelleCarte): LieuSeulCarte[] {
  if (seuls.length === 0) return seuls;
  const hauteurPoint = echelle.degresParPoint * echelle.cosLatitude;
  const places = relacherMarqueursCarte(
    [...seuls, ...fixes].map((seul, rang) => ({
      x: seul.longitude / echelle.degresParPoint,
      y: -seul.latitude / hauteurPoint,
      diametre: DIAMETRE_MARQUEUR_POINTS,
      mobile: rang < seuls.length,
    })),
    DEPLACEMENT_MAX_LIEU_RUE_POINTS,
  );
  return seuls.map((seul, rang) => {
    const { x, y } = places[rang];
    const longitude = x * echelle.degresParPoint;
    const latitude = -y * hauteurPoint;
    return Math.abs(longitude - seul.longitude) < 1e-12 && Math.abs(latitude - seul.latitude) < 1e-12 ? seul : { id: seul.id, latitude, longitude };
  });
}

function projeterLatitude(latitude: number): number {
  const sinus = Math.sin((Math.max(-LATITUDE_MAX, Math.min(LATITUDE_MAX, latitude)) * Math.PI) / 180);
  return 0.5 - Math.log((1 + sinus) / (1 - sinus)) / (4 * Math.PI);
}

function lireAmas(preparation: PreparationCarte, niveau: number, fenetre: Rectangle): { amas: AmasCarte[]; parId: Map<number, AmasCarte> } {
  let etage: EtageCarte | undefined = preparation.parNiveau.get(niveau);
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
      if (projete.point.prioritaire) continue;
      const colonne = Math.floor(projete.x / cote) - premiereColonne;
      const ligne = Math.floor(projete.y / cote) - premiereLigne;
      if (colonne < 0 || colonne >= colonnes || ligne < 0 || ligne >= lignes) continue;
      manquantes[colonne * lignes + ligne]?.push(projete);
    }
    manquantes.forEach((projetes, rang) => {
      if (!projetes) return;
      const formes = formerAmasCarte(projetes, niveau);
      parZone.set(cles[rang], formes);
      for (const un of formes) for (const { point } of un.membres) parId.set(point.id, un);
    });
  }
  return { amas: cles.flatMap((cle) => parZone.get(cle) ?? []), parId };
}

function regrouperAuMeilleurNiveau(
  preparation: PreparationCarte,
  echelle: EchelleCarte,
  budget: number,
  exclu: number | null,
  bornes: Rectangle,
  surplus: PointCarte[],
  finesse: number,
): Regroupement {
  const fenetre: Rectangle = { ouest: (bornes.ouest + 180) / 360, est: (bornes.est + 180) / 360, nord: projeterLatitude(bornes.nord), sud: projeterLatitude(bornes.sud) };
  const surplusProjete = surplus.map((point) => ({ point, x: (point.longitude + 180) / 360, y: projeterLatitude(point.latitude) }));
  const ideal = Math.log2(360 / (ECART_MARQUEURS_POINTS * echelle.degresParPoint));
  let niveau = Math.min(NIVEAU_MAX, Math.max(NIVEAU_MIN, Math.floor(ideal / PAS_NIVEAU) * PAS_NIVEAU + finesse));
  for (;;) {
    const lus = lireAmas(preparation, niveau, fenetre);
    const touche = exclu === null ? undefined : lus.parId.get(exclu);
    const amas = surplusProjete.length > 0 ? [...lus.amas, ...formerAmasCarte(surplusProjete, niveau)] : lus.amas;
    const seuls: PointCarte[] = [];
    const groupes: GroupeCarte[] = [];
    for (const un of amas) {
      if (un.nord < bornes.sud || un.sud > bornes.nord || un.est < bornes.ouest || un.ouest > bornes.est) continue;
      const restants = un === touche ? un.membres.filter(({ point }) => point.id !== exclu) : un.membres;
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

function trierParProximite(points: PointCarte[], echelle: EchelleCarte): PointCarte[] {
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
  return { cle, nombre: tries.length, latitude: latitude / tries.length, longitude: longitude / tries.length, ids: tries.map((membre) => membre.id) };
}

function ecarterMemesPlaces(points: PointCarte[], echelle: EchelleCarte): LieuSeulCarte[] {
  const parPlace = new Map<string, PointCarte[]>();
  for (const point of points) {
    const place = `${point.latitude.toFixed(DECIMALES_MEME_PLACE)}:${point.longitude.toFixed(DECIMALES_MEME_PLACE)}`;
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
