import { useLocation } from "react-router";

import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { TEXTES_PROPOSITION_LANGUE_PAR_LANGUE } from "~/contenus/proposition-langue";
import { utiliserLangue } from "~/hooks/utiliser-langue";

const CLASSE_BOUTON =
  "rounded-full border-2 border-encre px-3 py-1 text-sm font-semibold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre";

export function PropositionLangue({ proposee }: { proposee: Langue }) {
  const langue = utiliserLangue();
  const T = choisirTextes(TEXTES_PROPOSITION_LANGUE_PAR_LANGUE, proposee);
  const { pathname, search } = useLocation();
  return (
    <form method="post" action="/langue/choix" lang={proposee} aria-label={T.etiquette} className="border-b-2 border-encre bg-white text-encre print:hidden">
      <input type="hidden" name="retour" value={`${pathname}${search}`} />
      <div className="mx-auto flex w-[min(1120px,100%-32px)] flex-wrap items-center justify-center gap-x-4 gap-y-2 py-2 text-sm">
        <p>{T.message}</p>
        <div className="flex gap-2">
          <button type="submit" name="langue" value={proposee} className={`${CLASSE_BOUTON} bg-jaune shadow-brut-petit hover:bg-creme`}>
            {T.lire}
          </button>
          <button type="submit" name="langue" value={langue} className={`${CLASSE_BOUTON} bg-white hover:bg-creme`}>
            {T.refuser}
          </button>
        </div>
      </div>
    </form>
  );
}
