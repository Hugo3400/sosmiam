import { Link } from "react-router";

import { PastilleStatut } from "~/composants/pro/PastilleStatut";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { LieuDuCompte } from "~/types/pro";

const classeLien = "font-semibold underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

/** Ce que dit la carte d'un lieu pas encore (ou pas) vérifié. */
const explications = {
  "en-attente": "L'équipe SOS Miam vérifie que ce lieu est bien à toi. Repasse un peu plus tard : ta fiche s'ouvrira ici.",
  refuse: "L'équipe n'a pas pu confirmer que ce lieu est à toi. Une erreur ? Écris-nous à bonjour@sosmiam.fr, on regarde ça ensemble.",
};

/** Un lieu du tableau (dans une liste) : son statut et, une fois vérifié, les liens vers sa fiche, ses suggestions… */
export function CarteLieuPro({ lieu }: { lieu: LieuDuCompte }) {
  const adresse = `/lieu/${lieu.lieuId}`;
  return (
    <li className="flex h-full flex-col rounded-carte border-2 border-encre bg-white p-5 shadow-brut">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <h3 className="text-xl font-extrabold [overflow-wrap:anywhere]">{lieu.nom}</h3>
          <p className="text-sm text-gris">{lieu.ville} · {lieu.role === "gerant" ? "Gérant" : "Équipe"}</p>
        </div>
        <PastilleStatut statut={lieu.statut} />
      </div>
      {lieu.statut === "valide" ? (
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          <li><Link to={adresse} className={classeLien}>{lieu.role === "gerant" ? "Ma fiche" : "La fiche"}</Link></li>
          <li><Link to={`${adresse}/suggestions`} className={classeLien}>Suggestions</Link></li>
          <li><Link to={`${adresse}/equipe`} className={classeLien}>{lieu.role === "gerant" ? "Mon équipe" : "L'équipe"}</Link></li>
          <li><Link to={`${adresse}/affichette`} className={classeLien}>Affichette</Link></li>
        </ul>
      ) : (
        <p className="mt-4 text-gris">{lierPonctuation(explications[lieu.statut])}</p>
      )}
    </li>
  );
}
