import { Link } from "react-router";

import { TEXTES_PAGE_LIEUX_PAR_LANGUE } from "~/contenus/page-lieux";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function FilArianeLieux() {
  const T = utiliserTextes(TEXTES_PAGE_LIEUX_PAR_LANGUE).filAriane;
  const lien = utiliserLienLangue();
  return (
    <nav aria-label={T.etiquette} className="text-sm text-gris">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link to={lien("/")} className="underline underline-offset-4 hover:text-encre focus-visible:outline-3 focus-visible:outline-encre">{T.accueil}</Link>
        </li>
        <li aria-hidden="true">›</li>
        <li aria-current="page">{T.lieux}</li>
      </ol>
    </nav>
  );
}
