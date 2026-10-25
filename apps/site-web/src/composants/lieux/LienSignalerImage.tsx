import { Link } from "react-router";

import { TEXTES_FICHE_LIEU } from "~/contenus/fiche-lieu";

export function LienSignalerImage({ lieuId }: { lieuId: number }) {
  return (
    <Link
      to={`/lieux/${lieuId}/signaler-image`}
      rel="nofollow"
      className="self-start text-sm text-gris underline underline-offset-2 hover:text-encre focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre"
    >
      {TEXTES_FICHE_LIEU.signaler.image}
    </Link>
  );
}
