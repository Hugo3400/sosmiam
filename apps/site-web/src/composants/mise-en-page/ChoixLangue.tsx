import { useLocation } from "react-router";

import { NOMS_LANGUES, TEXTES_CHOIX_LANGUE_PAR_LANGUE } from "~/contenus/choix-langue";
import { utiliserLangue, utiliserLanguesServies } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function ChoixLangue() {
  const servies = utiliserLanguesServies();
  const langue = utiliserLangue();
  const T = utiliserTextes(TEXTES_CHOIX_LANGUE_PAR_LANGUE);
  const { pathname, search } = useLocation();
  if (servies.length < 2) return null;
  return (
    <form method="post" action="/langue/choix" aria-label={T.etiquette} className="mt-4 flex justify-center gap-2 text-sm">
      <input type="hidden" name="retour" value={`${pathname}${search}`} />
      {servies.map((choix) => (
        <button
          key={choix}
          type="submit"
          name="langue"
          value={choix}
          lang={choix}
          aria-pressed={choix === langue}
          className="rounded-full border-2 border-creme/40 px-3 py-1 font-semibold aria-pressed:border-jaune aria-pressed:text-jaune hover:border-creme focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-jaune"
        >
          {NOMS_LANGUES[choix]}
        </button>
      ))}
    </form>
  );
}
