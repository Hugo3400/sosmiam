import { IconeFiche } from "~/composants/lieux/IconeFiche";
import { TEXTES_CARTE_EN_GRAND } from "~/contenus/carte-en-grand";
import { ETIQUETTES } from "~/contenus/carte-du-lieu";
import type { FiltreCarte } from "~/types/carte";

type Props = {
  recherche: string;
  changerRecherche: (recherche: string) => void;
  filtres: readonly FiltreCarte[];
  disponibles: readonly FiltreCarte[];
  basculerFiltre: (filtre: FiltreCarte) => void;
  toutAfficher: () => void;
  nombre: number;
};

export function FiltresCarte({ recherche, changerRecherche, filtres, disponibles, basculerFiltre, toutAfficher, nombre }: Props) {
  const T = TEXTES_CARTE_EN_GRAND;
  const actif = recherche.trim() !== "" || filtres.length > 0;
  return (
    <div className="flex flex-col gap-3 print:hidden">
      <div role="group" aria-label={T.filtres.etiquette} className="flex flex-wrap items-center gap-2.5">
        <label className="flex w-full items-center gap-2 rounded-full border-2 border-encre bg-white px-4 py-2.5 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-encre sm:w-80">
          <IconeFiche nom="chercher" />
          <span className="sr-only">{T.recherche.etiquette}</span>
          <input
            type="search"
            value={recherche}
            onChange={(evenement) => changerRecherche(evenement.target.value)}
            placeholder={T.recherche.indication}
            className="min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none"
          />
        </label>
        {disponibles.map((filtre) => (
          <button
            key={filtre}
            type="button"
            aria-pressed={filtres.includes(filtre)}
            onClick={() => basculerFiltre(filtre)}
            className="min-h-10 rounded-full border-2 border-encre bg-white px-3.5 py-2 text-sm font-semibold hover:bg-jaune-clair focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre aria-pressed:bg-encre aria-pressed:text-jaune"
          >
            {filtre === "sans-alcool" ? T.filtres.sansAlcool : ETIQUETTES[filtre].libelle}
          </button>
        ))}
        {actif && (
          <button type="button" onClick={toutAfficher} className="min-h-10 px-2 text-sm font-semibold underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre focus-visible:outline-3 focus-visible:outline-encre">
            {T.filtres.toutAfficher}
          </button>
        )}
      </div>
      <p role="status" className="text-sm text-gris">{actif ? T.resultats(nombre) : ""}</p>
    </div>
  );
}
