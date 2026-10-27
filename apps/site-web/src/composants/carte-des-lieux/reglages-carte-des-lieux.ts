import type { CategorieLieu } from "~/types/lieux";

export const STYLE_FOND_DE_CARTE = "https://tiles.openfreemap.org/styles/liberty";

export const SOURCES_FOND_DE_CARTE = [
  { texte: "© OpenFreeMap", adresse: "https://openfreemap.org" },
  { texte: "© OpenMapTiles", adresse: "https://www.openmaptiles.org/" },
  { texte: "© OpenStreetMap", adresse: "https://www.openstreetmap.org/copyright" },
] as const;

export const POLICE_CARTE = ["Noto Sans Bold"];

export const COULEURS_EPINGLES: Record<CategorieLieu | "sos", string> = {
  resto: "#FF8A3D",
  patisserie: "#F7A8C4",
  bar: "#B39DDB",
  sortie: "#7CCFB5",
  sos: "#FF4D3D",
};

export const COULEURS_CARTE = {
  encre: "#1A1A1A",
  jaune: "#FFD60A",
  blanc: "#FFFFFF",
};

export const CENTRE_FRANCE: [number, number] = [2.4, 46.6];

export const ZOOM_FRANCE = 4.6;

export const ZOOM_UN_LIEU = 15;

export const ZOOM_ZONE = 13;
