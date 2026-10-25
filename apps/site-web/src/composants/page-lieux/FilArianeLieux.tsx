import { Link } from "react-router";

import { TEXTES_PAGE_LIEUX } from "~/contenus/page-lieux";

export function FilArianeLieux() {
  const T = TEXTES_PAGE_LIEUX.filAriane;
  return (
    <nav aria-label={T.etiquette} className="text-sm text-gris">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link to="/" className="underline underline-offset-4 hover:text-encre focus-visible:outline-3 focus-visible:outline-encre">{T.accueil}</Link>
        </li>
        <li aria-hidden="true">›</li>
        <li aria-current="page">{T.lieux}</li>
      </ol>
    </nav>
  );
}
