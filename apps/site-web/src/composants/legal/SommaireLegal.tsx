import { TEXTES_CADRE_LEGAL_PAR_LANGUE } from "~/contenus/legal/cadre-legal";
import type { ChapitreAffiche } from "~/fonctions/legal/regrouper-en-chapitres";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

const styleLien = "underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

/** « Au sommaire » d'une page légale : les chapitres numérotés et, dessous, leurs sections (liens vers les ancres). */
export function SommaireLegal({ chapitres }: { chapitres: ChapitreAffiche[] }) {
  const T = utiliserTextes(TEXTES_CADRE_LEGAL_PAR_LANGUE);
  return (
    <nav id="sommaire" aria-labelledby="sommaire-titre" className="mt-8 rounded-carte border-2 border-encre bg-white p-5 md:p-6">
      <h2 id="sommaire-titre" className="mb-4 text-xl font-extrabold">{T.auSommaire}</h2>
      <ol className="grid gap-3">
        {chapitres.map((chapitre) => (
          <li key={chapitre.id}>
            <a href={`#${chapitre.id}`} className="group flex gap-2 font-semibold">
              <span className="w-6 shrink-0 font-titre font-extrabold">{chapitre.numero}.</span>
              <span className="underline decoration-jaune decoration-[3px] underline-offset-2 group-hover:decoration-encre">{lierPonctuation(chapitre.titre)}</span>
            </a>
            {chapitre.sections.length > 1 && (
              <ul className="mt-1.5 grid gap-1 pl-8 text-sm text-gris">
                {chapitre.sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className={styleLien}>{lierPonctuation(section.titre)}</a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
