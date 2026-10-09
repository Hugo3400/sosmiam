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

const echapper = (texte: string) => texte.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

type Props = { lieux: ResumeLieu[]; onOuvrir: (id: number) => void };

/**
 * Les lieux sur une carte (ceux de la liste filtrée qui ont une position) : épingle à l'emoji du lieu, bordée selon son
 * statut (vert en ligne, gris brouillon, rouge masqué). Survol : nom, type et ville ; clic : la fiche s'ouvre.
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
      nouvelle.remove();
      carte.current = null;
    };
  }, []);

  useEffect(() => {
    const groupe = epingles.current;
    if (!groupe || !carte.current) return;
    groupe.clearLayers();
    const places = lieux.filter((lieu) => lieu.latitude !== null && lieu.longitude !== null);
    for (const lieu of places) {
      const icone = L.divIcon({ className: "", html: `<span class="epingle-lieu epingle-${lieu.statut}">${echapper(lieu.emoji)}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] });
      L.marker([lieu.latitude!, lieu.longitude!], { icon: icone, title: lieu.nom, keyboard: true })
        .bindTooltip(`<strong>${echapper(lieu.nom)}</strong><br>${TYPES_LIEU[lieu.type] ?? lieu.type} · ${echapper(lieu.ville)} · ${STATUTS_LIEU[lieu.statut].libelle}`, { direction: "top", offset: [0, -14] })
        .on("click", () => ouvrir.current(lieu.id))
        .addTo(groupe);
    }
    if (places.length) carte.current.fitBounds(L.latLngBounds(places.map((lieu) => [lieu.latitude!, lieu.longitude!])), { padding: [40, 40], maxZoom: 15 });
  }, [lieux]);

  return <div ref={conteneur} className="h-[620px] w-full overflow-hidden rounded-carte border border-ligne" role="region" aria-label="Carte des lieux" />;
}
