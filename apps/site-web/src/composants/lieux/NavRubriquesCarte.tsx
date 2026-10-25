import { TEXTES_CARTE_EN_GRAND } from "~/contenus/carte-en-grand";
import type { RubriqueCarte } from "~/types/carte";

export function NavRubriquesCarte({ rubriques }: { rubriques: RubriqueCarte[] }) {
  if (rubriques.length < 2) return null;
  return (
    <nav aria-label={TEXTES_CARTE_EN_GRAND.rubriques} className="print:hidden">
      <ul lang="fr" className="flex flex-wrap gap-2">
        {rubriques.map((rubrique) => (
          <li key={rubrique.id}>
            <a
              href={`#${rubrique.id}`}
              className="inline-block rounded-full border-2 border-encre bg-white px-3.5 py-2 text-sm font-semibold text-encre no-underline hover:bg-jaune-clair focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre"
            >
              {rubrique.titre}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
