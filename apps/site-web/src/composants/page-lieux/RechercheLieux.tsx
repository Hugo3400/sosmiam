import { Form, Link } from "react-router";

import { TEXTES_PAGE_LIEUX } from "~/contenus/page-lieux";
import { ecrireAdresseLieux } from "~/fonctions/page-lieux/ecrire-adresse-lieux";
import type { CategorieLieu } from "~/types/lieux";

type Props = { ville: string | null; type: CategorieLieu | null; recherche: string | null };

export function RechercheLieux({ ville, type, recherche }: Props) {
  const T = TEXTES_PAGE_LIEUX.recherche;
  return (
    <div className="flex w-full flex-col gap-1.5 md:w-[380px]">
      <Form method="get" action="/lieux" role="search" className="flex items-center gap-2 rounded-full border-2 border-encre bg-white py-1.5 pr-1.5 pl-4 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-encre">
        {ville && <input type="hidden" name="ville" value={ville} />}
        {type && <input type="hidden" name="type" value={type} />}
        <label htmlFor="recherche-lieux" className="sr-only">{T.etiquette}</label>
        <input
          id="recherche-lieux"
          type="search"
          name="q"
          maxLength={60}
          defaultValue={recherche ?? ""}
          key={recherche ?? ""}
          placeholder={T.indication}
          className="min-w-0 flex-1 bg-transparent text-base font-medium outline-none"
        />
        <button type="submit" aria-label={T.bouton} title={T.bouton} className="grid size-9 shrink-0 place-items-center rounded-full bg-encre text-jaune hover:bg-encre/85 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre">
          <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
        </button>
      </Form>
      {recherche && (
        <p className="flex flex-wrap gap-x-3 px-4 text-sm text-gris">
          <span>{T.resultat(recherche)}</span>
          <Link to={ecrireAdresseLieux({ ville, type })} className="font-semibold text-encre underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-encre">{T.effacer}</Link>
        </p>
      )}
    </div>
  );
}
