import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useRef } from "react";

import { STATUTS_LIEU, TYPES_LIEU } from "~/contenus/statuts-lieu.ts";
import type { ResumeLieu } from "~/services/lieux.ts";

/** Fond de carte : Plan IGN (Géoplateforme, service public gratuit ; autorisé dans la CSP de tauri.conf.json) */
const TUILES =
  "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal" +
  "&TILEMATRIXSET=PM&FORMAT=image/png&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}";
/** France métropolitaine, quand aucun lieu n'a de position */
const FRANCE: L.LatLngBoundsExpression = [[42.3, -4.8], [51.1, 8.3]];

/** Au-delà, des points légers (cercles SVG) plutôt que des épingles emoji : la carte reste fluide avec des milliers de lieux */
const EPINGLES_MAX = 400;
const BORDURES: Record<string, string> = { publie: "#1F7A4D", brouillon: "#9A968E", masque: "#B3261E" };

const echapper = (texte: string) => texte.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

type Props = { lieux: ResumeLieu[]; onOuvrir: (id: number) => void };

/**
 * Les lieux sur une carte (ceux de la liste filtrée qui ont une position) : épingle à l'emoji du lieu, bordée selon son
 * statut (vert en ligne, gris brouillon, rouge masqué) ; au-delà de 400 lieux, un point de la même couleur. Survol : nom,
 * type et ville ; clic : la fiche s'ouvre.
 */
export function CarteGeographiqueLieux({ lieux, onOuvrir }: Props) {
  const conteneur = useRef<HTMLDivElement>(null);
  const carte = useRef<L.Map | null>(null);
  const epingles = useRef<L.LayerGroup | null>(null);
  const ouvrir = useRef(onOuvrir);
  ouvrir.current = onOuvrir;

  useEffect(() => {
    if (!conteneur.current) return;
    const nouvelle = L.map(conteneur.current, { zoomControl: true, attributionControl: true });
    L.tileLayer(TUILES, { maxZoom: 19, attribution: "© IGN – Plan IGN" }).addTo(nouvelle);
    nouvelle.fitBounds(FRANCE);
    epingles.current = L.layerGroup().addTo(nouvelle);
    carte.current = nouvelle;
    return () => {
      nouvelle.stop();
      nouvelle.remove();
      carte.current = null;
    };
  }, []);

  useEffect(() => {
    const groupe = epingles.current;
    if (!groupe || !carte.current) return;
    groupe.clearLayers();
    const places = lieux.filter((lieu) => lieu.latitude !== null && lieu.longitude !== null);
    const leger = places.length > EPINGLES_MAX;
    for (const lieu of places) {
      const position: L.LatLngExpression = [lieu.latitude!, lieu.longitude!];
      const repere = leger
        ? L.circleMarker(position, { radius: 6, weight: 2, color: BORDURES[lieu.statut] ?? "#9A968E", fillColor: "#FFD60A", fillOpacity: 0.9 })
        : L.marker(position, {
          icon: L.divIcon({ className: "", html: `<span class="epingle-lieu epingle-${lieu.statut}">${echapper(lieu.emoji)}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] }),
          title: lieu.nom,
          keyboard: true,
        });
      repere
        .bindTooltip(`<strong>${echapper(lieu.nom)}</strong><br>${TYPES_LIEU[lieu.type] ?? lieu.type} · ${echapper(lieu.ville)} · ${STATUTS_LIEU[lieu.statut].libelle}`, { direction: "top", offset: [0, -14] })
        .on("click", () => ouvrir.current(lieu.id))
        .addTo(groupe);
    }
    // Sans animation : rien ne reste à faire sur la carte après sa fermeture (changement de vue, d'écran)
    if (places.length) carte.current.fitBounds(L.latLngBounds(places.map((lieu) => [lieu.latitude!, lieu.longitude!])), { padding: [40, 40], maxZoom: 15, animate: false });
  }, [lieux]);

  return <div ref={conteneur} className="h-[620px] w-full overflow-hidden rounded-carte border border-ligne" role="region" aria-label="Carte des lieux" />;
}
