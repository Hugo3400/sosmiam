import type { ReactNode } from "react";

import { TelephoneApercu } from "~/composants/apercus/TelephoneApercu";
import { Section } from "~/composants/mise-en-page/Section";
import type { BlocCommunaute } from "~/contenus/apercu-communaute";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  bloc: BlocCommunaute;
  numero: number;
  /** L'écran dessiné qui va dans le téléphone */
  ecran: ReactNode;
};

/**
 * Un bloc d'aperçu : numéro, titre, deux ou trois phrases, petites listes d'étiquettes, et l'écran de l'app dans un
 * téléphone dessiné. Un bloc sur deux sur fond crème, téléphone de l'autre côté (sur grand écran).
 */
export function BlocApercu({ bloc, numero, ecran }: Props) {
  const pair = numero % 2 === 0;
  return (
    <Section id={bloc.id} fond={pair ? "creme" : "blanc"}>
      <div className={`grid items-center gap-12 lg:gap-20 ${pair ? "md:grid-cols-[310px_minmax(0,1fr)]" : "md:grid-cols-[minmax(0,1fr)_310px]"}`}>
        <div className="min-w-0">
          <span
            className="mb-4 grid h-11 w-11 place-items-center rounded-full border-2 border-encre bg-jaune font-titre text-xl font-extrabold shadow-brut-petit"
            aria-hidden="true"
          >
            {numero}
          </span>
          <h2 className="text-[clamp(1.8rem,3.4vw,2.6rem)] font-extrabold tracking-tight">{lierPonctuation(bloc.titre)}</h2>
          <div className="mt-5 flex max-w-xl flex-col gap-3 text-[1.075rem]">
            {bloc.phrases.map((phrase) => <p key={phrase}>{lierPonctuation(phrase)}</p>)}
          </div>
          {bloc.listes?.map((liste) => (
            <div key={liste.titre} className="mt-6">
              <h3 className="mb-2.5 font-texte text-[.85rem] font-bold tracking-wide text-gris uppercase">{lierPonctuation(liste.titre)}</h3>
              <ul className="flex flex-wrap gap-2">
                {liste.elements.map((element) => (
                  <li key={element} className="rounded-full border-2 border-encre bg-white px-3 py-1 text-[.9rem] font-semibold">
                    {lierPonctuation(element)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className={pair ? "md:order-first" : ""}>
          <TelephoneApercu alt={bloc.alt} penche={pair ? "gauche" : "droite"}>
            {ecran}
          </TelephoneApercu>
        </div>
      </div>
    </Section>
  );
}
