import { ECART_FIXE_POINTS, ECART_MARQUEURS_POINTS, type EchelleCarte, type GroupeCarte, type LieuSeulCarte } from "~/contenus/regroupement-carte";

const DIRECTIONS = 16;
const PAS_RECHERCHE = 6;
const PORTEE_RECHERCHE = 3;
const PART_LIBRE = 0.9;
const PART_DEPLACEMENT = 0.4;
const PASSES = 4;
const ANGLE_DOR = 2.399963;

type Place = { x: number; y: number };

export function ecarterGroupesCarte(groupes: GroupeCarte[], fixes: LieuSeulCarte[], seuls: LieuSeulCarte[], echelle: EchelleCarte): GroupeCarte[] {
  if (groupes.length === 0) return groupes;
  const versEcran = (p: { latitude: number; longitude: number }): Place => ({
    x: p.longitude / echelle.degresParPoint,
    y: -p.latitude / (echelle.degresParPoint * echelle.cosLatitude),
  });
  const obstacles = fixes.map(versEcran);
  const immobiles = seuls.map(versEcran);
  const places = groupes.map(versEcran);
  const ecartFixe = ({ x, y }: Place) => obstacles.reduce((min, o) => Math.min(min, Math.max(Math.abs(o.x - x), Math.abs(o.y - y))), Infinity);
  const ecartAutres = (place: Place, sauf: number) => {
    let ecart = Infinity;
    for (const autre of immobiles) ecart = Math.min(ecart, Math.hypot(autre.x - place.x, autre.y - place.y));
    places.forEach((autre, rang) => {
      if (rang !== sauf) ecart = Math.min(ecart, Math.hypot(autre.x - place.x, autre.y - place.y));
    });
    return ecart;
  };

  places.forEach((ici, rang) => {
    if (obstacles.length === 0 || ecartFixe(ici) >= ECART_FIXE_POINTS) return;
    const proche = obstacles.reduce((a, b) => (Math.hypot(b.x - ici.x, b.y - ici.y) < Math.hypot(a.x - ici.x, a.y - ici.y) ? b : a));
    const naturel = Math.hypot(ici.x - proche.x, ici.y - proche.y) > 0.5 ? Math.atan2(ici.y - proche.y, ici.x - proche.x) : -Math.PI / 2;
    let meilleure: { place: Place; fixe: number; libre: number } | null = null;
    recherche: for (let distance = PAS_RECHERCHE; distance <= ECART_FIXE_POINTS * PORTEE_RECHERCHE; distance += PAS_RECHERCHE) {
      for (let pas = 0; pas < DIRECTIONS; pas++) {
        const angle = naturel + ((2 * Math.PI) / DIRECTIONS) * (pas % 2 === 0 ? pas / 2 : -(pas + 1) / 2);
        const place = { x: ici.x + distance * Math.cos(angle), y: ici.y + distance * Math.sin(angle) };
        const fixe = Math.min(ecartFixe(place), ECART_FIXE_POINTS);
        const libre = fixe >= ECART_FIXE_POINTS - 0.5 ? ecartAutres(place, rang) : 0;
        if (fixe >= ECART_FIXE_POINTS - 0.5 && libre >= ECART_MARQUEURS_POINTS * PART_LIBRE) {
          meilleure = { place, fixe, libre };
          break recherche;
        }
        if (!meilleure || fixe > meilleure.fixe || (fixe === meilleure.fixe && libre > meilleure.libre)) meilleure = { place, fixe, libre };
      }
    }
    if (meilleure) places[rang] = meilleure.place;
  });

  const departs = places.map((place) => ({ ...place }));
  const deplacementMax = ECART_MARQUEURS_POINTS * PART_DEPLACEMENT;
  const bouger = (rang: number, dx: number, dy: number) => {
    const suivante = { x: places[rang].x + dx, y: places[rang].y + dy };
    const depuis = Math.sqrt((suivante.x - departs[rang].x) ** 2 + (suivante.y - departs[rang].y) ** 2);
    if (depuis > deplacementMax) {
      suivante.x = departs[rang].x + ((suivante.x - departs[rang].x) * deplacementMax) / depuis;
      suivante.y = departs[rang].y + ((suivante.y - departs[rang].y) * deplacementMax) / depuis;
    }
    if (obstacles.length > 0 && ecartFixe(suivante) < Math.min(ECART_FIXE_POINTS, ecartFixe(places[rang]))) return;
    places[rang] = suivante;
  };
  const separer = (de: Place, vers: Place, graine: number) => {
    const dx = vers.x - de.x;
    const dy = vers.y - de.y;
    if (dx >= ECART_MARQUEURS_POINTS || dx <= -ECART_MARQUEURS_POINTS || dy >= ECART_MARQUEURS_POINTS || dy <= -ECART_MARQUEURS_POINTS) return null;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance >= ECART_MARQUEURS_POINTS) return null;
    if (distance > 0.01) return { ux: dx / distance, uy: dy / distance, manque: ECART_MARQUEURS_POINTS - distance };
    return { ux: Math.cos(graine * ANGLE_DOR), uy: Math.sin(graine * ANGLE_DOR), manque: ECART_MARQUEURS_POINTS - distance };
  };
  const tous = [...places.map((place, rang) => ({ rang, place })), ...immobiles.map((place) => ({ rang: -1, place }))];
  for (let passe = 0; passe < PASSES; passe++) {
    let bouge = false;
    for (const marqueur of tous) if (marqueur.rang >= 0) marqueur.place = places[marqueur.rang];
    tous.sort((a, b) => a.place.x - b.place.x);
    for (let i = 0; i < tous.length; i++) {
      const premier = tous[i];
      for (let j = i + 1; j < tous.length && tous[j].place.x - premier.place.x < ECART_MARQUEURS_POINTS; j++) {
        const second = tous[j];
        if (premier.rang < 0 && second.rang < 0) continue;
        const mobile = premier.rang >= 0 ? premier : second;
        const autre = mobile === premier ? second : premier;
        const ecart = separer(autre.rang >= 0 ? places[autre.rang] : autre.place, places[mobile.rang], mobile.rang + Math.max(0, autre.rang));
        if (!ecart) continue;
        bouge = true;
        if (autre.rang < 0) {
          bouger(mobile.rang, ecart.ux * ecart.manque, ecart.uy * ecart.manque);
          continue;
        }
        bouger(mobile.rang, (ecart.ux * ecart.manque) / 2, (ecart.uy * ecart.manque) / 2);
        bouger(autre.rang, (-ecart.ux * ecart.manque) / 2, (-ecart.uy * ecart.manque) / 2);
      }
    }
    if (!bouge) break;
  }

  return groupes.map((groupe, rang) => {
    const avant = versEcran(groupe);
    if (Math.abs(avant.x - places[rang].x) < 1e-6 && Math.abs(avant.y - places[rang].y) < 1e-6) return groupe;
    return { ...groupe, longitude: places[rang].x * echelle.degresParPoint, latitude: -places[rang].y * echelle.degresParPoint * echelle.cosLatitude };
  });
}
