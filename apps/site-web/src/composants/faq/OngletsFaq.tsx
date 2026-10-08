import { useRef, type KeyboardEvent } from "react";

import type { OngletFaq } from "~/contenus/faq/type-faq";

type Props = {
  onglets: OngletFaq[];
  actif: string;
  /** Pendant une recherche, les onglets passent au second plan (bordure en pointillés, aucun sélectionné) */
  attenues: boolean;
  onChoisir: (cle: string) => void;
};

function couleurs(onglet: OngletFaq, estActif: boolean) {
  if (onglet.alerte) {
    return estActif ? "border-rouge-sos bg-rouge-sos text-white" : "border-rouge-texte bg-white text-rouge-texte hover:bg-rose-alerte";
  }
  return estActif ? "border-encre bg-encre text-jaune" : "border-encre bg-white hover:bg-jaune-clair";
}

/** Les thèmes de la FAQ. Flèches gauche/droite, Début et Fin pour passer d'un onglet à l'autre. */
export function OngletsFaq({ onglets, actif, attenues, onChoisir }: Props) {
  const boutons = useRef<(HTMLButtonElement | null)[]>([]);

  function naviguerAuClavier(e: KeyboardEvent<HTMLDivElement>) {
    const i = onglets.findIndex((onglet) => onglet.cle === actif);
    const cible = ({ ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: onglets.length - 1 } as Record<string, number>)[e.key];
    if (cible === undefined) return;
    e.preventDefault();
    const suivant = (cible + onglets.length) % onglets.length;
    onChoisir(onglets[suivant].cle);
    boutons.current[suivant]?.focus();
  }

  return (
    <div role="tablist" aria-label="Thèmes des questions" onKeyDown={naviguerAuClavier}
      className="mb-7 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:justify-center">
      {onglets.map((onglet, i) => {
        const estActif = onglet.cle === actif;
        return (
          <button
            key={onglet.cle}
            ref={(bouton) => { boutons.current[i] = bouton; }}
            type="button"
            role="tab"
            id={`faq-onglet-${onglet.cle}`}
            aria-selected={estActif && !attenues}
            aria-controls={`faq-panneau-${onglet.cle}`}
            tabIndex={estActif ? 0 : -1}
            onClick={() => onChoisir(onglet.cle)}
            className={`rounded-full border-2 px-2 py-2.5 text-sm font-semibold whitespace-nowrap transition sm:px-4 sm:text-[.95rem]
              focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-encre last:odd:col-span-2
              ${couleurs(onglet, estActif && !attenues)} ${attenues ? "border-dashed" : ""}`}
          >
            <span aria-hidden="true">{onglet.emoji}</span> {onglet.titre}
          </button>
        );
      })}
    </div>
  );
}
