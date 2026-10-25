import { Link } from "react-router";

import { TEXTES_PAGE_LIEUX } from "~/contenus/page-lieux";
import { listerPagesVisibles } from "~/fonctions/page-lieux/lister-pages-visibles";

type Props = { page: number; pages: number; adressePage: (page: number) => string };

const FOCUS = "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre";
const ROND = "grid size-11 place-items-center rounded-full";
const BOUTON = "inline-flex items-center gap-1 rounded-full border-2 px-4 py-2";

export function PaginationLieux({ page, pages, adressePage }: Props) {
  const T = TEXTES_PAGE_LIEUX.pagination;
  if (pages <= 1) return null;
  return (
    <nav aria-label={T.etiquette} className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-2 text-[15px] font-semibold">
        {page > 1 ? (
          <Link to={adressePage(page - 1)} rel="prev" className={`${BOUTON} border-encre bg-white hover:bg-jaune-clair ${FOCUS}`}>
            <span aria-hidden="true">←</span> {T.precedents}
          </Link>
        ) : (
          <span aria-disabled="true" className={`${BOUTON} border-ligne text-gris`}><span aria-hidden="true">←</span> {T.precedents}</span>
        )}
        <ul className="hidden items-center gap-2 sm:flex">
          {listerPagesVisibles(page, pages).map((element, rang) => (
            <li key={element === "ellipse" ? `ellipse-${rang}` : element}>
              {element === "ellipse" ? (
                <span aria-hidden="true" className="px-1 text-gris">{T.ellipse}</span>
              ) : element === page ? (
                <span aria-current="page" className={`${ROND} bg-encre text-jaune`}>
                  <span className="sr-only">{T.page(element)}</span>
                  <span aria-hidden="true">{element}</span>
                </span>
              ) : (
                <Link to={adressePage(element)} aria-label={T.page(element)} className={`${ROND} border-2 border-encre bg-white hover:bg-jaune-clair ${FOCUS}`}>
                  {element}
                </Link>
              )}
            </li>
          ))}
        </ul>
        <p className="text-sm sm:hidden">{T.pageSur(page, pages)}</p>
        {page < pages ? (
          <Link to={adressePage(page + 1)} rel="next" className={`${BOUTON} border-encre bg-jaune shadow-brut-petit hover:-translate-y-0.5 ${FOCUS}`}>
            {T.suivants} <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <span aria-disabled="true" className={`${BOUTON} border-ligne text-gris`}>{T.suivants} <span aria-hidden="true">→</span></span>
        )}
      </div>
      <p className="text-center text-[13px] text-gris">{T.note}</p>
    </nav>
  );
}
