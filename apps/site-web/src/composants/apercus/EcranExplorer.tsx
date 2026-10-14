import { BarreOngletsApp } from "~/composants/apercus/BarreOngletsApp";
import { EnTeteEcran } from "~/composants/apercus/EnTeteEcran";
import { EtiquetteEcran } from "~/composants/apercus/EtiquetteEcran";
import { PictoCategorie } from "~/composants/marque/PictoCategorie";
import type { CategorieLieu } from "~/types/lieux";

const FILTRES = ["Tout", "Petit budget", "Vegan", "Accessible en fauteuil", "Calme"];

// Lieux inventés ; le Restaurant du Capitaine Bouiboui est le lieu de démo de SOS Miam
const LIEUX: { nom: string; infos: string; categorie: CategorieLieu; verifie: boolean; sos?: boolean; confirmees: string[]; proposees: [string, number][] }[] = [
  {
    nom: "Restaurant du Capitaine Bouiboui",
    infos: "Bistrot · à 800 m",
    categorie: "resto",
    verifie: true,
    sos: true,
    confirmees: ["Petit budget", "Accessible en fauteuil"],
    proposees: [["Animaux bienvenus", 4]],
  },
  { nom: "Le Comptoir des Miamis", infos: "Salon de thé · à 2 km", categorie: "patisserie", verifie: true, confirmees: ["Petit budget", "Vegan", "Calme"], proposees: [] },
  { nom: "La Cantine de la Brigade", infos: "Street food · à 600 m", categorie: "resto", verifie: false, confirmees: [], proposees: [["Petit budget", 11], ["Vegan", 3]] },
];

/** Écran Explorer avec les étiquettes : filtres, étiquettes confirmées par le lieu et proposées par les Miamis. */
export function EcranExplorer() {
  return (
    <>
      <EnTeteEcran titre="Explorer" />
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden px-4">
        <span className="flex shrink-0 items-center gap-2 rounded-2xl border border-ligne bg-white px-3 py-2 text-[12px] text-gris">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm9 2-4-4" />
          </svg>
          Chercher un lieu
        </span>
        <span className="flex shrink-0 gap-1.5 overflow-hidden">
          {FILTRES.map((filtre) => (
            <EtiquetteEcran key={filtre} variante={filtre === "Petit budget" ? "sombre" : "claire"}>{filtre}</EtiquetteEcran>
          ))}
        </span>
        <span className="flex shrink-0 flex-wrap gap-x-3 gap-y-1 text-[10.5px] text-gris">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-jaune ring-1 ring-encre" /> confirmée par le lieu</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full border border-dashed border-gris" /> proposée par les Miamis</span>
        </span>
        {LIEUX.map((lieu) => (
          <div key={lieu.nom} className="flex shrink-0 flex-col gap-2 rounded-[18px] border border-ligne bg-white p-3">
            <span className="flex items-center gap-2.5">
              <PictoCategorie type={lieu.categorie} className="h-9 w-9 shrink-0" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[12.5px] leading-tight font-bold">{lieu.nom}</span>
                <span className="text-[10.5px] text-gris">{lieu.infos}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-0.5">
                {lieu.sos && <span className="rounded-md bg-tomate px-1.5 font-titre text-[10px] font-extrabold text-white">SOS</span>}
                <span className={`text-[10px] font-bold ${lieu.verifie ? "" : "text-gris"}`}>{lieu.verifie ? "Vérifié ✓" : "Non vérifié"}</span>
              </span>
            </span>
            <span className="flex flex-wrap gap-1">
              {lieu.confirmees.map((etiquette) => <EtiquetteEcran key={etiquette} variante="jaune">{etiquette}</EtiquetteEcran>)}
              {lieu.proposees.map(([etiquette, nombre]) => (
                <EtiquetteEcran key={etiquette} variante="proposee">{`${etiquette} · ${nombre}`}</EtiquetteEcran>
              ))}
            </span>
          </div>
        ))}
      </div>
      <BarreOngletsApp actif="Explorer" />
    </>
  );
}
