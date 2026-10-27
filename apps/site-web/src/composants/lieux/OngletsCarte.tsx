import { useRef, useState, type KeyboardEvent } from "react";

import { ElementCarteDuLieu } from "~/composants/lieux/ElementCarteDuLieu";
import { TEXTES_FICHE_LIEU_PAR_LANGUE } from "~/contenus/fiche-lieu";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { RubriqueCarte } from "~/types/carte";

const DEPLACEMENTS: Record<string, (rang: number, nombre: number) => number> = {
  ArrowRight: (rang, nombre) => (rang + 1) % nombre,
  ArrowLeft: (rang, nombre) => (rang - 1 + nombre) % nombre,
  Home: () => 0,
  End: (_rang, nombre) => nombre - 1,
};

export function OngletsCarte({ rubriques }: { rubriques: RubriqueCarte[] }) {
  const T = utiliserTextes(TEXTES_FICHE_LIEU_PAR_LANGUE);
  const [actif, changerActif] = useState(0);
  const onglets = useRef<(HTMLButtonElement | null)[]>([]);
  const rubrique = rubriques[actif] ?? rubriques[0];
  if (!rubrique) return null;

  function deplacer(evenement: KeyboardEvent<HTMLButtonElement>, rang: number) {
    const deplacement = DEPLACEMENTS[evenement.key];
    if (!deplacement) return;
    evenement.preventDefault();
    const suivant = deplacement(rang, rubriques.length);
    changerActif(suivant);
    onglets.current[suivant]?.focus();
  }

  return (
    <>
      <div role="tablist" aria-label={T.carte.rubriques} className="flex flex-wrap gap-2">
        {rubriques.map((uneRubrique, rang) => (
          <button
            key={uneRubrique.id}
            ref={(bouton) => {
              onglets.current[rang] = bouton;
            }}
            id={`${uneRubrique.id}-onglet`}
            type="button"
            role="tab"
            aria-selected={rang === actif}
            aria-controls={`${uneRubrique.id}-panneau`}
            tabIndex={rang === actif ? 0 : -1}
            onClick={() => changerActif(rang)}
            onKeyDown={(evenement) => deplacer(evenement, rang)}
            lang="fr"
            className="rounded-full border-2 border-encre bg-white px-3.5 py-2 text-sm font-semibold hover:bg-jaune-clair focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre aria-selected:bg-encre aria-selected:text-jaune"
          >
            {uneRubrique.titre}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${rubrique.id}-panneau`} aria-labelledby={`${rubrique.id}-onglet`} tabIndex={0} lang="fr" className="rounded-xl focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-encre">
        <ul>
          {rubrique.elements.map((element, rang) => <ElementCarteDuLieu key={`${rang}-${element.nom}`} element={element} />)}
        </ul>
      </div>
    </>
  );
}
