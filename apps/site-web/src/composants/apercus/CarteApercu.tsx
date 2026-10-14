import { Link } from "react-router";

import type { Apercu } from "~/contenus/apercus";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  apercu: Apercu;
  /** Texte du lien (« Voir l'aperçu ») */
  lien: string;
};

/** Une carte de /preview : toute la carte mène à l'aperçu (le lien du titre la couvre). */
export function CarteApercu({ apercu, lien }: Props) {
  return (
    <article className="group relative flex h-full flex-col gap-4 rounded-carte border-2 border-encre bg-white p-6 shadow-brut transition-[translate,box-shadow] duration-150 focus-within:shadow-brut-grand hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-grand">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border-2 border-encre bg-jaune-clair text-4xl" aria-hidden="true">
          {apercu.emoji}
        </span>
        <span className="rounded-full bg-jaune px-3 py-1 text-[.8rem] font-bold">En préparation</span>
      </div>
      <h2 className="text-2xl font-extrabold">
        <Link
          to={apercu.adresse}
          className="after:absolute after:inset-0 after:rounded-carte focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:outline-offset-4 focus-visible:after:outline-encre"
        >
          {lierPonctuation(apercu.titre)}
        </Link>
      </h2>
      <p className="text-gris">{lierPonctuation(apercu.accroche)}</p>
      <ul className="flex flex-wrap gap-2" aria-label="Au menu de cet aperçu">
        {apercu.points.map((point) => (
          <li key={point} className="rounded-full border border-ligne bg-creme px-3 py-1 text-[.85rem] font-semibold">
            {lierPonctuation(point)}
          </li>
        ))}
      </ul>
      <p className="mt-auto pt-2 font-bold underline decoration-jaune decoration-[3px] underline-offset-4 group-hover:decoration-encre" aria-hidden="true">
        {lierPonctuation(lien)} →
      </p>
    </article>
  );
}
