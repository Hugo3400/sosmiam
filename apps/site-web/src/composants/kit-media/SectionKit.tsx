import type { ReactNode } from "react";

import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  /** Ancre de la section, et identifiant de son titre */
  id: string;
  titre: string;
  texte?: string;
  children: ReactNode;
};

/** Une partie de la page du kit média : titre, courte explication, puis son contenu. */
export function SectionKit({ id, titre, texte, children }: Props) {
  return (
    <section id={id} aria-labelledby={`titre-${id}`} className="mt-14">
      <h2 id={`titre-${id}`} className="text-[clamp(1.6rem,3vw,2.1rem)] font-extrabold tracking-tight">{lierPonctuation(titre)}</h2>
      {texte && <p className="mt-2 max-w-2xl text-gris">{lierPonctuation(texte)}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}
