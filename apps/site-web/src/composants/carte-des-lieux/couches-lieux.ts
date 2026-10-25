import type { FeatureCollection, Point } from "geojson";
import type { ExpressionSpecification, Map as CarteMaplibre } from "maplibre-gl";

import { COULEURS_CARTE, COULEURS_EPINGLES, POLICE_CARTE } from "~/composants/carte-des-lieux/reglages-carte-des-lieux";
import type { ProprietesEpingle } from "~/fonctions/carte-des-lieux/creer-donnees-geojson";

export const COUCHES_LIEUX = {
  source: "lieux",
  groupesOmbre: "lieux-groupes-ombre",
  groupes: "lieux-groupes",
  groupesNombre: "lieux-groupes-nombre",
  pointsOmbre: "lieux-points-ombre",
  points: "lieux-points",
  choisi: "lieux-choisi",
  lettres: "lieux-lettres",
} as const;

const C = COUCHES_LIEUX;
const EST_GROUPE: ExpressionSpecification = ["has", "point_count"];
const EST_POINT: ExpressionSpecification = ["!", ["has", "point_count"]];
const AVEC_SOS: ExpressionSpecification = [">", ["get", "sos"], 0];
const RAYON_GROUPE: ExpressionSpecification = ["step", ["get", "point_count"], 17, 25, 21, 100, 26, 500, 31];
const RAYON_POINT = 12;
const RAYON_CHOISI = 17;

const COULEUR_POINT: ExpressionSpecification = [
  "case",
  ["get", "sos"],
  COULEURS_EPINGLES.sos,
  ["match", ["get", "type"], "resto", COULEURS_EPINGLES.resto, "patisserie", COULEURS_EPINGLES.patisserie, "bar", COULEURS_EPINGLES.bar, COULEURS_EPINGLES.sortie],
];

export function filtrerLieuChoisi(id: number | null): ExpressionSpecification {
  return ["==", ["get", "id"], id ?? -1];
}

export function ajouterCouchesLieux(carte: CarteMaplibre, donnees: FeatureCollection<Point, ProprietesEpingle>, regrouper: boolean) {
  carte.addSource(C.source, {
    type: "geojson",
    data: donnees,
    cluster: regrouper,
    clusterRadius: 46,
    clusterMaxZoom: 14,
    clusterProperties: { sos: ["+", ["case", ["get", "sos"], 1, 0]] },
  });
  const texte = { "text-font": POLICE_CARTE, "text-allow-overlap": true, "text-ignore-placement": true };
  carte.addLayer({ id: C.groupesOmbre, type: "circle", source: C.source, filter: EST_GROUPE, paint: { "circle-color": COULEURS_CARTE.encre, "circle-radius": RAYON_GROUPE, "circle-translate": [2, 2] } });
  carte.addLayer({
    id: C.groupes,
    type: "circle",
    source: C.source,
    filter: EST_GROUPE,
    paint: {
      "circle-color": COULEURS_CARTE.jaune,
      "circle-radius": RAYON_GROUPE,
      "circle-stroke-color": ["case", AVEC_SOS, COULEURS_EPINGLES.sos, COULEURS_CARTE.encre],
      "circle-stroke-width": ["case", AVEC_SOS, 3, 2],
    },
  });
  carte.addLayer({
    id: C.groupesNombre,
    type: "symbol",
    source: C.source,
    filter: EST_GROUPE,
    layout: { ...texte, "text-field": ["get", "point_count_abbreviated"], "text-size": 13 },
    paint: { "text-color": COULEURS_CARTE.encre },
  });
  carte.addLayer({ id: C.pointsOmbre, type: "circle", source: C.source, filter: EST_POINT, paint: { "circle-color": COULEURS_CARTE.encre, "circle-radius": RAYON_POINT, "circle-translate": [2, 2] } });
  carte.addLayer({
    id: C.points,
    type: "circle",
    source: C.source,
    filter: EST_POINT,
    paint: { "circle-color": COULEUR_POINT, "circle-radius": RAYON_POINT, "circle-stroke-color": COULEURS_CARTE.encre, "circle-stroke-width": 2 },
  });
  carte.addLayer({
    id: C.choisi,
    type: "circle",
    source: C.source,
    filter: filtrerLieuChoisi(null),
    paint: { "circle-color": COULEUR_POINT, "circle-radius": RAYON_CHOISI, "circle-stroke-color": COULEURS_CARTE.encre, "circle-stroke-width": 3 },
  });
  carte.addLayer({
    id: C.lettres,
    type: "symbol",
    source: C.source,
    filter: EST_POINT,
    layout: { ...texte, "text-field": ["get", "lettre"], "text-size": 12 },
    paint: { "text-color": COULEURS_CARTE.encre },
  });
}
