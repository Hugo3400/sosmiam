import type { ReactNode } from "react";

import { BlocsTexte } from "~/composants/interface/BlocsTexte";
import type { ChapitreAffiche } from "~/fonctions/legal/regrouper-en-chapitres";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  chapitre: ChapitreAffiche;
  /** Ce qui s'ajoute après le texte d'une section (par `id` de section), par exemple le bouton de /statistiques */
  complements?: Partial<Record<string, ReactNode>>;
};

const styleTexte = "grid gap-4 text-gris [&_strong]:text-encre";

/**
 * Un chapitre numéroté d'une page légale. Plusieurs sections : chacune a son sous-titre (« 2.1 ») et son ancre ;
 * une seule : son texte suit directement le titre du chapitre, et garde son ancre.
 */
export function ChapitreLegal({ chapitre, complements = {} }: Props) {
  const plusieurs = chapitre.sections.length > 1;
  return (
    <section id={chapitre.id} aria-labelledby={`${chapitre.id}-titre`} className="mt-12 border-t-2 border-encre/10 pt-8">
      <h2 id={`${chapitre.id}-titre`} className="mb-5 flex gap-3 text-2xl font-extrabold md:text-[1.75rem]">
        <span className="shrink-0 rounded-lg bg-jaune px-2 leading-normal">{chapitre.numero}</span>
        <span>{lierPonctuation(chapitre.titre)}</span>
      </h2>
      {chapitre.sections.map((section, i) => (
        <div key={section.id} id={section.id} className={plusieurs ? "mt-8 first-of-type:mt-0" : undefined}>
          {plusieurs && (
            <h3 className="mb-3 text-xl font-extrabold">
              <span className="text-gris">{chapitre.numero}.{i + 1}</span> {lierPonctuation(section.titre)}
            </h3>
          )}
          <div className={styleTexte}>
            <BlocsTexte blocs={section.blocs} />
            {complements[section.id]}
          </div>
        </div>
      ))}
    </section>
  );
}
