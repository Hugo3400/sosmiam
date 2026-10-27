import { Link, useLocation } from "react-router";

import { TEXTES_PAGES_LEGALES_PAR_LANGUE } from "~/contenus/legal/liens-legaux";
import { listerPagesLegales } from "~/fonctions/legal/lister-pages-legales";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** « À lire aussi » en bas d'une page légale : les autres pages légales, avec une phrase chacune. */
export function PagesLegalesLiees() {
  const { pathname } = useLocation();
  const T = utiliserTextes(TEXTES_PAGES_LEGALES_PAR_LANGUE);
  const autres = listerPagesLegales(T, utiliserLangue()).filter((page) => page.href !== pathname);
  return (
    <nav aria-labelledby="a-lire-aussi" className="mt-16 border-t-2 border-encre/10 pt-8">
      <h2 id="a-lire-aussi" className="mb-4 text-xl font-extrabold">{T.aLireAussi}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {autres.map((page) => (
          <li key={page.href}>
            <Link to={page.href} className="block h-full rounded-carte border-2 border-encre bg-white p-4 hover:bg-jaune-clair">
              <span className="font-titre font-extrabold">{lierPonctuation(page.texte)}</span>
              <span className="mt-1 block text-sm text-gris">{lierPonctuation(page.resume)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
