import { villesFrance } from "@sos-miam/commun/contenus/villes-france";
import { MARGE_VUE_CARTE } from "~/contenus/regroupement-carte";

export function creerHasard(graine) {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const TAILLE_TELEPHONE = { largeur: 390, hauteur: 760 };

export const TAILLE_IPAD = { largeur: 1024, hauteur: 1366 };

export const MARSEILLE = { latitude: 43.2965, longitude: 5.3698 };

export function creerPointsFrance(nombre, graine = 1, { partMemePlace = 0.05, partPrioritaires = 0.03 } = {}) {
  const hasard = creerHasard(graine);
  const villes = [MARSEILLE, MARSEILLE, MARSEILLE, ...villesFrance];
  const points = [];
  for (let i = 0; i < nombre; i++) {
    const prioritaire = hasard() < partPrioritaires;
    if (points.length > 0 && hasard() < partMemePlace) {
      const modele = points[Math.floor(hasard() * points.length)];
      points.push({ id: i + 1, latitude: modele.latitude, longitude: modele.longitude, prioritaire });
      continue;
    }
    const ville = villes[Math.floor(hasard() * villes.length)];
    const etendue = hasard() < 0.7 ? 0.02 : 0.15;
    const angle = hasard() * Math.PI * 2;
    const rayon = Math.sqrt(hasard()) * etendue;
    points.push({
      id: i + 1,
      latitude: ville.latitude + rayon * Math.sin(angle),
      longitude: ville.longitude + (rayon * Math.cos(angle)) / Math.cos((ville.latitude * Math.PI) / 180),
      prioritaire,
    });
  }
  return points;
}

export function regionAutour(centre, metresDeLarge, taille = TAILLE_TELEPHONE) {
  const cos = Math.cos((centre.latitude * Math.PI) / 180);
  const longitudeDelta = metresDeLarge / (111_320 * cos);
  const latitudeDelta = (longitudeDelta / taille.largeur) * cos * taille.hauteur;
  return { latitude: centre.latitude, longitude: centre.longitude, latitudeDelta, longitudeDelta };
}

export function simulerCadrage(coins, taille = TAILLE_TELEPHONE, { haut = 0, bas = 0, marge = 40 } = {}) {
  const [nordOuest, sudEst] = coins;
  const centre = { latitude: (nordOuest.latitude + sudEst.latitude) / 2, longitude: (nordOuest.longitude + sudEst.longitude) / 2 };
  const cos = Math.cos((centre.latitude * Math.PI) / 180);
  const largeurVisible = taille.largeur - marge * 2;
  const hauteurVisible = taille.hauteur - haut - bas - marge * 2;
  const degresParPoint = Math.max((sudEst.longitude - nordOuest.longitude) / largeurVisible, (nordOuest.latitude - sudEst.latitude) / cos / hauteurVisible);
  return { ...centre, longitudeDelta: degresParPoint * taille.largeur, latitudeDelta: degresParPoint * cos * taille.hauteur };
}

export function compterMarqueurs(resultat) {
  return resultat.seuls.length + resultat.groupes.length;
}

export function creerPointsDenses(nombre, centre, rayonMetres, graine = 1, { premierId = 1, partPrioritaires = 0 } = {}) {
  const hasard = creerHasard(graine);
  const cos = Math.cos((centre.latitude * Math.PI) / 180);
  return Array.from({ length: nombre }, (_, rang) => {
    const angle = hasard() * Math.PI * 2;
    const distance = Math.sqrt(hasard()) * rayonMetres;
    return {
      id: premierId + rang,
      latitude: centre.latitude + (distance * Math.sin(angle)) / 111_320,
      longitude: centre.longitude + (distance * Math.cos(angle)) / (111_320 * cos),
      prioritaire: hasard() < partPrioritaires,
    };
  });
}

export function versEcran(region, point, taille = TAILLE_TELEPHONE) {
  const degresParPoint = region.longitudeDelta / taille.largeur;
  const cos = Math.cos((region.latitude * Math.PI) / 180);
  return { x: (point.longitude - region.longitude) / degresParPoint, y: -(point.latitude - region.latitude) / (degresParPoint * cos) };
}

export function verifierSortie(resultat, message = "") {
  if (!(typeof resultat.marge === "number" && resultat.marge >= 0 && resultat.marge <= MARGE_VUE_CARTE)) throw new Error(`${message} : marge ${resultat.marge} impossible`);
  const vus = new Set();
  for (const seul of resultat.seuls) {
    if (!Number.isFinite(seul.latitude) || !Number.isFinite(seul.longitude)) throw new Error(`${message} : lieu seul ${seul.id} sans position valable`);
    if (vus.has(seul.id)) throw new Error(`${message} : lieu ${seul.id} montré deux fois`);
    vus.add(seul.id);
  }
  for (const groupe of resultat.groupes) {
    if (groupe.nombre < 2) throw new Error(`${message} : bulle ${groupe.cle} de ${groupe.nombre} lieu`);
    if (groupe.devant !== undefined && groupe.devant !== true) throw new Error(`${message} : bulle ${groupe.cle} avec devant à ${groupe.devant}`);
    if (groupe.ids.length !== groupe.nombre) throw new Error(`${message} : bulle ${groupe.cle} annonce ${groupe.nombre} lieux pour ${groupe.ids.length} ids`);
    if (!Number.isFinite(groupe.latitude) || !Number.isFinite(groupe.longitude)) throw new Error(`${message} : bulle ${groupe.cle} sans position valable`);
    for (let rang = 1; rang < groupe.ids.length; rang++) if (groupe.ids[rang - 1] >= groupe.ids[rang]) throw new Error(`${message} : ids de la bulle ${groupe.cle} pas triés`);
    for (const id of groupe.ids) {
      if (vus.has(id)) throw new Error(`${message} : lieu ${id} montré deux fois`);
      vus.add(id);
    }
  }
  return vus;
}

export function dansLaFenetre(point, region, taille = TAILLE_TELEPHONE, marge = MARGE_VUE_CARTE) {
  const degresParPoint = region.longitudeDelta / taille.largeur;
  const cos = Math.cos((region.latitude * Math.PI) / 180);
  const part = 0.5 + marge;
  const demiLatitude = Math.max(region.latitudeDelta, degresParPoint * cos * taille.hauteur) * part;
  const demiLongitude = region.longitudeDelta * part;
  return Math.abs(point.latitude - region.latitude) <= demiLatitude && Math.abs(point.longitude - region.longitude) <= demiLongitude;
}

export function dansLaVue(point, region) {
  return Math.abs(point.latitude - region.latitude) <= region.latitudeDelta / 2 && Math.abs(point.longitude - region.longitude) <= region.longitudeDelta / 2;
}

export function metresParPoint(region, taille = TAILLE_TELEPHONE) {
  return (region.longitudeDelta / taille.largeur) * 111_320 * Math.cos((region.latitude * Math.PI) / 180);
}

export function barycentreEcran(groupe, parId, region, taille = TAILLE_TELEPHONE) {
  const membres = groupe.ids.map((id) => versEcran(region, parId.get(id), taille));
  return { x: membres.reduce((somme, m) => somme + m.x, 0) / membres.length, y: membres.reduce((somme, m) => somme + m.y, 0) / membres.length, membres };
}
