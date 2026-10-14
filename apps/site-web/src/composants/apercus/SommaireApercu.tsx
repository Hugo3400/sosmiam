import type { BlocCommunaute } from "~/contenus/apercu-communaute";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** « Au menu » : un lien par bloc de l'aperçu (ancres sans « # » dans l'adresse, voir utiliserAncresSansDiese). */
export function SommaireApercu({ titre, blocs }: { titre: string; blocs: BlocCommunaute[] }) {
  return (
    <nav aria-labelledby="sommaire-apercu" className="mt-10">
      <h2 id="sommaire-apercu" className="mb-3 font-texte text-[.85rem] font-bold tracking-wide text-gris uppercase">
        {titre}
      </h2>
      <ol className="flex flex-wrap gap-2.5">
        {blocs.map((bloc, rang) => (
          <li key={bloc.id}>
            <a
              href={`#${bloc.id}`}
              className="inline-flex items-center gap-2 rounded-full border-2 border-encre bg-white py-1.5 pr-3.5 pl-1.5 text-[.95rem] font-semibold shadow-brut-petit transition-[translate,box-shadow] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-encre"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-jaune font-titre text-sm font-extrabold" aria-hidden="true">
                {rang + 1}
              </span>
              {lierPonctuation(bloc.court)}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
