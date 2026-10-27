import { Link } from "react-router";

import { TEXTES_FICHE_LIEU_PAR_LANGUE } from "~/contenus/fiche-lieu";
import { choisirCouleursLieu } from "~/fonctions/lieux/choisir-couleurs-lieu";
import { choisirEmojiLieu } from "~/fonctions/lieux/choisir-emoji-lieu";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { FichePublique } from "~/types/pro";

export function EnTeteFicheLieu({ lieu }: { lieu: FichePublique }) {
  const T = utiliserTextes(TEXTES_FICHE_LIEU_PAR_LANGUE).filAriane;
  const lien = utiliserLienLangue();
  const [debut, fin] = choisirCouleursLieu(lieu.couleurs);
  return (
    <div className="relative">
      {lieu.banniere ? (
        <div className="h-44 overflow-hidden bg-ligne sm:h-56 md:h-[300px]">
          <img src={lieu.banniere} alt="" width={1600} height={500} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="grid h-40 place-items-center text-7xl md:h-[220px] md:text-8xl" style={{ background: `linear-gradient(135deg, ${debut}, ${fin})` }}>
          <span aria-hidden="true">{choisirEmojiLieu(lieu.emoji)}</span>
        </div>
      )}
      <nav aria-label={T.etiquette} className="absolute top-6 left-0 hidden w-full md:block">
        <div className="mx-auto w-[min(1120px,100%-32px)]">
          <ol className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-sm">
            <li>
              <Link to={lien("/")} className="font-medium underline-offset-2 hover:underline focus-visible:outline-3 focus-visible:outline-encre">{T.accueil}</Link>
            </li>
            <li className="flex min-w-0 items-center gap-1.5">
              <span aria-hidden="true">›</span>
              <span aria-current="page" className="max-w-[40ch] truncate">{lieu.nom}</span>
            </li>
          </ol>
        </div>
      </nav>
    </div>
  );
}
