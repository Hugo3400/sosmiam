import { Link } from "react-router";

import { TEXTES_PAGE_LIEUX_PAR_LANGUE } from "~/contenus/page-lieux";
import type { VueLieux } from "~/fonctions/page-lieux/lire-filtres-lieux";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = { vue: VueLieux; adresseListe: string; adresseCarte: string; className?: string };

const CLASSE = "rounded-full py-2.5 text-center text-[15px] font-bold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre aria-[current=page]:bg-encre aria-[current=page]:text-jaune";

export function ChoixVueLieux({ vue, adresseListe, adresseCarte, className = "" }: Props) {
  const T = utiliserTextes(TEXTES_PAGE_LIEUX_PAR_LANGUE).vues;
  return (
    <nav aria-label={T.etiquette} className={`grid grid-cols-2 rounded-full border-2 border-encre bg-white p-1 ${className}`}>
      <Link to={adresseListe} aria-current={vue === "liste" ? "page" : undefined} className={CLASSE}>{T.liste}</Link>
      <Link to={adresseCarte} aria-current={vue === "carte" ? "page" : undefined} className={CLASSE}>{T.carte}</Link>
    </nav>
  );
}
