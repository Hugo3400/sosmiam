import { BoutonRattachement } from "~/composants/pro/BoutonRattachement";
import { TEXTES_TABLEAU_PRO_PAR_LANGUE } from "~/contenus/tableau-pro";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { Rattachement } from "~/types/pro";

/** Une invitation reçue à rejoindre l'équipe d'un lieu (dans une liste) : l'accepter ou la refuser. */
export function CarteInvitation({ invitation }: { invitation: Rattachement }) {
  const T = utiliserTextes(TEXTES_TABLEAU_PRO_PAR_LANGUE).invitation;
  return (
    <li className="flex flex-wrap items-center justify-between gap-4 rounded-carte border-2 border-dashed border-encre bg-jaune-clair p-5">
      <p className="min-w-0 flex-[1_1_16rem]">
        <span aria-hidden="true">💌 </span>
        {lierPonctuation(T.debut)}
        <strong className="[overflow-wrap:anywhere]">{invitation.nom}</strong>
        {` (${invitation.ville}).`}
      </p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <BoutonRattachement rattachementId={invitation.id} geste="accepter" texte={T.accepter} precision={T.precision(invitation.nom)} principal />
        <BoutonRattachement rattachementId={invitation.id} geste="retirer" texte={T.refuser} precision={T.precision(invitation.nom)} />
      </div>
    </li>
  );
}
