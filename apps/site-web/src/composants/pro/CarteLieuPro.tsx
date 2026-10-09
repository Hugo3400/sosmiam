import { Link } from "react-router";

import { BoutonRattachement } from "~/composants/pro/BoutonRattachement";
import { PastilleStatut } from "~/composants/pro/PastilleStatut";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
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
  return (
    <li className="flex h-full flex-col rounded-carte border-2 border-encre bg-white p-5 shadow-brut">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 items-start gap-3">
          <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-encre bg-jaune text-xl">{emoji || "📍"}</span>
          <div className="min-w-0">
            <h3 className="text-xl font-extrabold [overflow-wrap:anywhere]">{nom}</h3>
            <p className="text-sm text-gris">{ville} · {gerant ? "Gérant" : "Équipe"}</p>
          </div>
        </div>
        <PastilleStatut statut={statut} />
      </div>
      {statut === "valide" && (
        <>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            <li><Link to={adresse} className={classeLien}>{gerant ? "Ma fiche" : "La fiche"}</Link></li>
            <li><Link to={`${adresse}/carte`} className={classeLien}>{gerant ? "Ma carte" : "La carte"}</Link></li>
            <li><Link to={`${adresse}/suggestions`} className={classeLien}>Suggestions</Link></li>
            {gerant && <li><Link to={`${adresse}/equipe`} className={classeLien}>Mon équipe</Link></li>}
            <li><Link to={`${adresse}/affichette`} className={classeLien}>Affichette</Link></li>
            <li><Link to={`${adresse}/miam-safe`} className={classeLien}>Miam Safe</Link></li>
          </ul>
          {!gerant && (
            <div className="mt-auto pt-4">
              <BoutonRattachement rattachementId={rattachement.id} geste="retirer" texte="Quitter ce lieu" precision={nom} />
            </div>
          )}
        </>
      )}
      {statut === "en-attente" && (
        <>
          <p className="mt-4 text-gris">{lierPonctuation("L'équipe SOS Miam vérifie que ce lieu est bien à toi. Repasse un peu plus tard : sa fiche s'ouvrira ici.")}</p>
          <div className="mt-auto pt-4">
            <BoutonRattachement rattachementId={rattachement.id} geste="retirer" texte="Annuler ma demande" precision={nom} />
          </div>
        </>
      )}
      {statut === "refuse" && (
        <>
          <p className="mt-4 text-gris">{lierPonctuation("L'équipe n'a pas pu confirmer que ce lieu est à toi.")}</p>
          {reponse && <p className="mt-2 rounded-xl bg-creme px-3 py-2 text-sm"><span className="font-semibold">{lierPonctuation("Le mot de l'équipe : ")}</span>{reponse}</p>}
          <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-4">
            {gerant && <Link to={`/rattacher/${lieuId}`} className={classeLien}>Redemander</Link>}
            <BoutonRattachement rattachementId={rattachement.id} geste="retirer" texte="Retirer de ma liste" precision={nom} />
          </div>
        </>
      )}
    </li>
  );
}
