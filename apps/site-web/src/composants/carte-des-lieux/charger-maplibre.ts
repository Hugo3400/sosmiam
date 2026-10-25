import "maplibre-gl/dist/maplibre-gl.css";
import adresseTravailleur from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import * as maplibre from "maplibre-gl";

export function chargerMaplibre(): typeof maplibre {
  maplibre.setWorkerUrl(new URL(adresseTravailleur, window.location.origin).href);
  return maplibre;
}
