import { Link } from "react-router";

import { IconeCarte } from "~/composants/carte-des-lieux/IconeCarte";
import { PastilleCarteLieu } from "~/composants/lieux/PastilleCarteLieu";
import { TEXTES_CARTE_DES_LIEUX } from "~/contenus/carte-des-lieux";
import { creerLienItinerairePosition } from "~/fonctions/carte-des-lieux/creer-lien-itineraire-position";
import { choisirCouleursLieu } from "~/fonctions/lieux/choisir-couleurs-lieu";
import { choisirEmojiLieu } from "~/fonctions/lieux/choisir-emoji-lieu";
import { utiliserApercuLieu } from "~/hooks/utiliser-apercu-lieu";
import type { EpingleLieu } from "~/types/lieux";

type Props = { epingle: EpingleLieu; surFermer: () => void; className?: string };

const CLASSE_LIEN = "font-bold text-encre underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre";

export function CarteLieuChoisi({ epingle, surFermer, className = "" }: Props) {
  const T = TEXTES_CARTE_DES_LIEUX;
  const apercu = utiliserApercuLieu(epingle.id);
  const [debut, fin] = choisirCouleursLieu(apercu?.couleurs ?? []);
  const details = apercu ? [apercu.info, apercu.prix, apercu.quartier || apercu.ville].filter(Boolean).join(" · ") : T.legende[epingle.type];
  const pastille = apercu ?? { sos: null, verifie: undefined };
  return (
    <section aria-label={epingle.nom} className={`flex overflow-hidden rounded-carte border-2 border-encre bg-white shadow-brut ${className}`}>
      {apercu && (
        <div className="relative hidden w-[96px] shrink-0 place-items-center text-[40px] sm:grid" style={{ background: `linear-gradient(135deg, ${debut}, ${fin})` }}>
          <span aria-hidden="true">{choisirEmojiLieu(apercu.emoji)}</span>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-3">
        <div className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {epingle.sos && !apercu?.sos ? (
              <span className="self-start rounded-full border-[1.5px] border-rouge-sos bg-rose-alerte px-2.5 py-0.5 text-xs font-bold text-rouge-texte">{T.lieuChoisi.sos}</span>
            ) : (
              <PastilleCarteLieu lieu={pastille} />
            )}
            <p className="font-titre text-lg leading-tight font-extrabold [overflow-wrap:anywhere]">{epingle.nom}</p>
          </div>
          <button
            type="button"
            onClick={surFermer}
            aria-label={T.boutons.fermerLieu}
            title={T.boutons.fermerLieu}
            className="-mt-1 -mr-2 grid size-9 shrink-0 place-items-center rounded-full hover:bg-jaune-clair focus-visible:outline-3 focus-visible:outline-encre"
          >
            <IconeCarte nom="fermer" className="size-4" />
          </button>
        </div>
        <p className="truncate text-[13px] text-gris">{details}</p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Link to={`/lieux/${epingle.id}`} className={CLASSE_LIEN}>
            {T.lieuChoisi.voirFiche}
            <span className="sr-only">{T.lieuChoisi.de(epingle.nom)}</span>
            <span aria-hidden="true"> →</span>
          </Link>
          <a href={creerLienItinerairePosition(epingle)} rel="noopener nofollow" className={CLASSE_LIEN}>
            {T.lieuChoisi.itineraire}
            <span className="sr-only">{T.lieuChoisi.vers(epingle.nom)}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
