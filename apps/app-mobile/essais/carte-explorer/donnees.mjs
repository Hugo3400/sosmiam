import { villesFrance } from "@sos-miam/commun/contenus/villes-france";

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

export function coinsAutour(points, demiMin) {
  const latitudes = points.map((p) => p.latitude);
  const longitudes = points.map((p) => p.longitude);
  const centre = {
    latitude: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
    longitude: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
  };
  const demiLatitude = Math.max((Math.max(...latitudes) - Math.min(...latitudes)) / 2, demiMin);
  const demiLongitude = Math.max((Math.max(...longitudes) - Math.min(...longitudes)) / 2, demiMin / Math.cos((centre.latitude * Math.PI) / 180));
  return [
    { latitude: centre.latitude + demiLatitude, longitude: centre.longitude - demiLongitude },
    { latitude: centre.latitude - demiLatitude, longitude: centre.longitude + demiLongitude },
  ];
}

export function compterMarqueurs(resultat) {
  return resultat.seuls.length + resultat.groupes.length;
}
