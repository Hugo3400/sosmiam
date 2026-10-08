import { Link } from "react-router";
import type { ReactNode } from "react";

type Props = {
  vers: string;
  emoji: string;
  titre: string;
  texte: ReactNode;
  /** Petite pastille : « 2 à faire », « 1 non lu »… */
  pastille?: string | null;
};

/** Une tuile de l'espace ambassadeur (dans une liste) : un lien vers une partie de l'espace. */
export function TuileEspace({ vers, emoji, titre, texte, pastille }: Props) {
  return (
    <li>
      <Link
        to={vers}
        className="flex h-full flex-col rounded-carte border-2 border-encre bg-white p-5 shadow-brut transition-[translate,box-shadow] duration-150
          hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-grand focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-encre"
      >
        <span className="flex items-start justify-between gap-3">
          <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-full border-2 border-encre bg-jaune text-2xl">{emoji}</span>
          {pastille && <span className="rounded-full bg-encre px-3 py-1 text-sm font-bold text-jaune">{pastille}</span>}
        </span>
        <span className="mt-4 font-titre text-xl font-extrabold">{titre}</span>
        <span className="mt-1 text-gris">{texte}</span>
      </Link>
    </li>
  );
}
