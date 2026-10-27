import { Link } from "react-router";

import { TEXTES_FICHE_LIEU_PAR_LANGUE } from "~/contenus/fiche-lieu";
import { choisirCouleursLieu } from "~/fonctions/lieux/choisir-couleurs-lieu";
import { choisirEmojiLieu } from "~/fonctions/lieux/choisir-emoji-lieu";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { LieuListe } from "~/types/lieux";

export function CarteLieuAutour({ lieu, sansVisuel = false }: { lieu: LieuListe; sansVisuel?: boolean }) {
  const T = utiliserTextes(TEXTES_FICHE_LIEU_PAR_LANGUE).autour;
  const langue = utiliserLangue();
  const [debut, fin] = choisirCouleursLieu(lieu.couleurs);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[18px] border-2 border-encre bg-white shadow-brut-petit transition-transform focus-within:ring-4 focus-within:ring-encre hover:-translate-y-0.5 motion-reduce:hover:translate-y-0">
      {!sansVisuel && (
        <div className="grid h-[90px] place-items-center text-[40px]" style={{ background: `linear-gradient(135deg, ${debut}, ${fin})` }}>
          {lieu.logo ? (
            <img src={lieu.logo} alt="" width={56} height={56} className="h-14 w-14 rounded-xl border-2 border-encre bg-white object-cover" />
          ) : (
            <span aria-hidden="true">{choisirEmojiLieu(lieu.emoji)}</span>
          )}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-[3px] px-3.5 py-3">
        <h3 className="font-titre text-[17px] font-extrabold [overflow-wrap:anywhere]">
          <Link to={`/lieux/${lieu.id}`} className="outline-none group-hover:underline after:absolute after:inset-0 after:content-['']">
            {lieu.nom}
          </Link>
        </h3>
        <p lang={langue === "fr" ? undefined : "fr"} className="text-[13px] text-gris">{[lieu.info, lieu.prix].filter(Boolean).join(" · ")}</p>
        {lieu.sos && <p className="text-[13px] font-bold text-rouge-texte">{T.sos}</p>}
      </div>
    </article>
  );
}
