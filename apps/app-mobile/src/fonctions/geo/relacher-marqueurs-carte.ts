import type { MarqueurARelacher, PlaceEcran } from "~/contenus/regroupement-carte";

const PASSES = 4;
const ANGLE_DOR = 2.399963;
const CHEVAUCHEMENT_PERMIS = 2;

type Accepter = (rang: number, avant: PlaceEcran, apres: PlaceEcran) => boolean;

export function relacherMarqueursCarte(marqueurs: MarqueurARelacher[], accepter: Accepter = () => true): PlaceEcran[] {
  const places = marqueurs.map(({ x, y }) => ({ x, y }));
  const mobile = (rang: number) => marqueurs[rang].deplacementMax > 0;
  if (!marqueurs.some((_, rang) => mobile(rang))) return places;
  const departs = marqueurs.map(({ x, y, ancre }) => ancre ?? { x, y });
  const portee = Math.max(...marqueurs.map((marqueur) => marqueur.diametre)) - CHEVAUCHEMENT_PERMIS;
  const bouger = (rang: number, dx: number, dy: number) => {
    const suivante = { x: places[rang].x + dx, y: places[rang].y + dy };
    const depuis = Math.hypot(suivante.x - departs[rang].x, suivante.y - departs[rang].y);
    const { deplacementMax } = marqueurs[rang];
    if (depuis > deplacementMax) {
      suivante.x = departs[rang].x + ((suivante.x - departs[rang].x) * deplacementMax) / depuis;
      suivante.y = departs[rang].y + ((suivante.y - departs[rang].y) * deplacementMax) / depuis;
    }
    if (accepter(rang, places[rang], suivante)) places[rang] = suivante;
  };
  const ordre = marqueurs.map((_, rang) => rang);
  for (let passe = 0; passe < PASSES; passe++) {
    const debut = places.map((place) => place.x);
    ordre.sort((a, b) => debut[a] - debut[b] || a - b);
    let change = false;
    for (let i = 0; i < ordre.length; i++) {
      const premier = ordre[i];
      for (let j = i + 1; j < ordre.length && debut[ordre[j]] - debut[premier] < portee; j++) {
        const second = ordre[j];
        if (!mobile(premier) && !mobile(second)) continue;
        const bouge = mobile(premier) ? premier : second;
        const autre = bouge === premier ? second : premier;
        const voulu = (marqueurs[bouge].diametre + marqueurs[autre].diametre) / 2 - CHEVAUCHEMENT_PERMIS;
        const dx = places[bouge].x - places[autre].x;
        const dy = places[bouge].y - places[autre].y;
        if (dx >= voulu || dx <= -voulu || dy >= voulu || dy <= -voulu) continue;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance >= voulu) continue;
        const ux = distance > 0.01 ? dx / distance : Math.cos((bouge + autre) * ANGLE_DOR);
        const uy = distance > 0.01 ? dy / distance : Math.sin((bouge + autre) * ANGLE_DOR);
        const manque = voulu - distance;
        change = true;
        if (!mobile(autre)) {
          bouger(bouge, ux * manque, uy * manque);
          continue;
        }
        bouger(bouge, (ux * manque) / 2, (uy * manque) / 2);
        bouger(autre, (-ux * manque) / 2, (-uy * manque) / 2);
      }
    }
    if (!change) break;
  }
  return places;
}
