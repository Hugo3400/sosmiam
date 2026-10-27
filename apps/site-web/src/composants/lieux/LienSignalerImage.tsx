import { Link } from "react-router";

import { TEXTES_FICHE_LIEU_PAR_LANGUE } from "~/contenus/fiche-lieu";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function LienSignalerImage({ lieuId }: { lieuId: number }) {
  const T = utiliserTextes(TEXTES_FICHE_LIEU_PAR_LANGUE);
  return (
    <Link
      to={`/lieux/${lieuId}/signaler-image`}
      rel="nofollow"
      className="self-start text-sm text-gris underline underline-offset-2 hover:text-encre focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre"
    >
      {T.signaler.image}
    </Link>
  );
}
