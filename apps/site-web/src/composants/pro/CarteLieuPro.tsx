import { Link } from "react-router";

import { BoutonRattachement } from "~/composants/pro/BoutonRattachement";
import { PastilleStatut } from "~/composants/pro/PastilleStatut";
import { NOM_MIAM_SAFE } from "~/contenus/cadre-pro";
import { TEXTES_IMAGES_LIEU_PAR_LANGUE } from "~/contenus/pro-images-lieu";
import { TEXTES_TABLEAU_PRO_PAR_LANGUE } from "~/contenus/tableau-pro";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { Rattachement } from "~/types/pro";

const classeLien = "font-semibold underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

/**
 * Un lieu du tableau (dans une liste) : son statut ; vérifié, les liens vers sa fiche, sa carte, ses suggestions, son
 * équipe et son affichette (et « Quitter ce lieu » pour un membre de l'équipe) ; en attente, « Annuler ma demande » ; refusé, le mot
 * de l'équipe et « Redemander ».
 */
export function CarteLieuPro({ rattachement }: { rattachement: Rattachement }) {
  const { lieuId, nom, ville, emoji, role, statut, reponse } = rattachement;
  const adresse = `/lieu/${lieuId}`;
  const gerant = role === "gerant";
  const T = utiliserTextes(TEXTES_TABLEAU_PRO_PAR_LANGUE).lieu;
  const lienImages = utiliserTextes(TEXTES_IMAGES_LIEU_PAR_LANGUE).lien;
  return (
    <li className="flex h-full flex-col rounded-carte border-2 border-encre bg-white p-5 shadow-brut">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 items-start gap-3">
          <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-encre bg-jaune text-xl">{emoji || "📍"}</span>
          <div className="min-w-0">
            <h3 className="text-xl font-extrabold [overflow-wrap:anywhere]">{nom}</h3>
            <p className="text-sm text-gris">{ville} · {gerant ? T.gerant : T.equipe}</p>
          </div>
        </div>
        <PastilleStatut statut={statut} />
      </div>
      {statut === "valide" && (
        <>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            <li><Link to={adresse} className={classeLien}>{gerant ? T.maFiche : T.laFiche}</Link></li>
            <li><Link to={`${adresse}/carte`} className={classeLien}>{gerant ? T.maCarte : T.laCarte}</Link></li>
            <li><Link to={`${adresse}/images`} className={classeLien}>{lienImages}</Link></li>
            <li><Link to={`${adresse}/suggestions`} className={classeLien}>{T.suggestions}</Link></li>
            {gerant && <li><Link to={`${adresse}/equipe`} className={classeLien}>{T.monEquipe}</Link></li>}
            <li><Link to={`${adresse}/affichette`} className={classeLien}>{T.affichette}</Link></li>
            <li><Link to={`${adresse}/miam-safe`} className={classeLien}>{NOM_MIAM_SAFE}</Link></li>
            <li><Link to={`${adresse}/kit`} className={classeLien}>{T.kit}</Link></li>
          </ul>
          {!gerant && (
            <div className="mt-auto pt-4">
              <BoutonRattachement rattachementId={rattachement.id} geste="retirer" texte={T.quitter} precision={nom} />
            </div>
          )}
        </>
      )}
      {statut === "en-attente" && (
        <>
          <p className="mt-4 text-gris">{lierPonctuation(T.enAttente)}</p>
          <div className="mt-auto pt-4">
            <BoutonRattachement rattachementId={rattachement.id} geste="retirer" texte={T.annuler} precision={nom} />
          </div>
        </>
      )}
      {statut === "refuse" && (
        <>
          <p className="mt-4 text-gris">{lierPonctuation(T.refuse)}</p>
          {reponse && <p className="mt-2 rounded-xl bg-creme px-3 py-2 text-sm"><span className="font-semibold">{lierPonctuation(T.motEquipe)}</span>{reponse}</p>}
          <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-4">
            {gerant && <Link to={`/rattacher/${lieuId}`} className={classeLien}>{T.redemander}</Link>}
            <BoutonRattachement rattachementId={rattachement.id} geste="retirer" texte={T.retirer} precision={nom} />
          </div>
        </>
      )}
    </li>
  );
}
