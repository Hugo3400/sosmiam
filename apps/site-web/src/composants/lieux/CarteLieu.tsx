import { Link } from "react-router";

import { PastilleCarteLieu } from "~/composants/lieux/PastilleCarteLieu";
import { TEXTES_CARTE_LIEU_PAR_LANGUE } from "~/contenus/carte-lieu";
import { choisirCouleursLieu } from "~/fonctions/lieux/choisir-couleurs-lieu";
import { choisirEmojiLieu } from "~/fonctions/lieux/choisir-emoji-lieu";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { LieuCarte } from "~/types/lieux";

type Props = {
  lieu: LieuCarte;
  disposition?: "colonne" | "ligne";
};

/**
 * Carte d'un vrai lieu publié : visuel, nom, ce que c'est, quartier et ville, prix, et qui l'a fait découvrir. Toute la
 * carte mène à sa fiche (/lieux/:id) : le lien est sur le nom, et son ::after couvre la carte (un seul lien, lu une fois).
 */
export function CarteLieu({ lieu, disposition = "colonne" }: Props) {
  const T = utiliserTextes(TEXTES_CARTE_LIEU_PAR_LANGUE);
  const langue = utiliserLangue();
  const [debut, fin] = choisirCouleursLieu(lieu.couleurs);
  const enLigne = disposition === "ligne";
  const bordure = lieu.sos ? "border-rouge-sos shadow-[3px_3px_0_var(--color-rouge-sos)]" : "border-encre shadow-brut-petit";
  const ou = [lieu.quartier, lieu.ville].filter(Boolean).join(", ");
  return (
    <article
      className={`group relative flex h-full overflow-hidden rounded-carte border-2 bg-white transition-transform focus-within:ring-4 focus-within:ring-encre hover:-translate-y-1 motion-reduce:hover:translate-y-0 ${bordure} ${enLigne ? "min-h-[120px] flex-row" : "flex-col"}`}
    >
      <div
        className={`relative grid shrink-0 place-items-center ${enLigne ? "w-[88px] text-[36px] sm:w-[116px] sm:text-[46px]" : "h-[132px] text-[54px]"}`}
        style={{ background: `linear-gradient(135deg, ${debut}, ${fin})` }}
      >
        <span aria-hidden="true">{choisirEmojiLieu(lieu.emoji)}</span>
        {lieu.logo && (
          <img
            src={lieu.logo}
            alt=""
            width={40}
            height={40}
            loading="lazy"
            className="absolute top-2.5 left-2.5 h-10 w-10 rounded-xl border-2 border-encre bg-white object-cover"
          />
        )}
      </div>
      <div className={`flex min-w-0 flex-1 flex-col gap-1 ${enLigne ? "px-4 py-3.5" : "px-[18px] pt-4 pb-[18px]"}`}>
        <PastilleCarteLieu lieu={lieu} />
        <h3 className={`font-titre font-extrabold leading-tight ${enLigne ? "truncate text-[19px]" : "line-clamp-2 text-xl"}`}>
          <Link to={`/lieux/${lieu.id}`} className="underline-offset-4 outline-none group-hover:underline after:absolute after:inset-0 after:content-['']">
            {lieu.nom}
          </Link>
        </h3>
        <p lang={langue === "fr" ? undefined : "fr"} className="text-sm text-gris">{[lieu.info, lieu.prix].filter(Boolean).join(" · ")}</p>
        {ou && <p className={`text-sm text-gris ${enLigne ? "truncate" : ""}`}>{ou}</p>}
        {lieu.decouvertPar && (
          <p className="mt-auto pt-2 text-sm font-semibold"><span aria-hidden="true">🛟 </span>{T.denichePar(lieu.decouvertPar)}</p>
        )}
      </div>
    </article>
  );
}
