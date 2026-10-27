import { BlocsTexte } from "~/composants/interface/BlocsTexte";
import { TEXTES_CADRE_LEGAL_PAR_LANGUE } from "~/contenus/legal/cadre-legal";
import type { BlocTexte } from "~/contenus/type-bloc-texte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = { titre: string; miseAJour: string; introduction: BlocTexte[] };

/** Haut d'une page légale : titre (cible du bouton « Haut de page »), date de mise à jour bien visible, introduction. */
export function EnTeteLegal({ titre, miseAJour, introduction }: Props) {
  const T = utiliserTextes(TEXTES_CADRE_LEGAL_PAR_LANGUE);
  return (
    <header>
      <h1 id="haut" className="text-[clamp(2rem,4vw,2.8rem)] font-extrabold tracking-tight [overflow-wrap:anywhere]">{lierPonctuation(titre)}</h1>
      <p className="mt-3 inline-flex items-center gap-2 rounded-full border-2 border-encre bg-jaune-clair px-3 py-1 text-sm font-semibold">
        <span aria-hidden="true">🗓️</span>
        {lierPonctuation(T.miseAJour(miseAJour))}
      </p>
      <div className="mt-6 grid gap-4 text-lg">
        <BlocsTexte blocs={introduction} />
      </div>
    </header>
  );
}
