import type { ChapitreAffiche } from "~/fonctions/legal/regrouper-en-chapitres";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const styleLien = "underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

/** « Au sommaire » d'une page légale : les chapitres numérotés et, dessous, leurs sections (liens vers les ancres). */
export function SommaireLegal({ chapitres }: { chapitres: ChapitreAffiche[] }) {
  return (
    <nav id="sommaire" aria-labelledby="sommaire-titre" className="mt-8 rounded-carte border-2 border-encre bg-white p-5 md:p-6">
      <h2 id="sommaire-titre" className="mb-4 text-xl font-extrabold">Au sommaire</h2>
      <ol className="grid gap-3">
        {chapitres.map((chapitre) => (
          <li key={chapitre.id} className="grid grid-cols-[2rem_1fr] gap-x-1">
            <span aria-hidden="true" className="font-titre font-extrabold">{chapitre.numero}.</span>
            <div>
              <a href={`#${chapitre.id}`} className={`font-semibold ${styleLien}`}>
                <span className="sr-only">{chapitre.numero}. </span>{lierPonctuation(chapitre.titre)}
              </a>
              {chapitre.sections.length > 1 && (
                <ul className="mt-1.5 grid gap-1 text-sm text-gris">
                  {chapitre.sections.map((section) => (
                    <li key={section.id}>
                      <a href={`#${section.id}`} className={styleLien}>{lierPonctuation(section.titre)}</a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
