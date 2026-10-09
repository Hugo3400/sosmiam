import { BoutonRattachement } from "~/composants/pro/BoutonRattachement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { Rattachement } from "~/types/pro";

/** Une invitation reçue à rejoindre l'équipe d'un lieu (dans une liste) : l'accepter ou la refuser. */
export function CarteInvitation({ invitation }: { invitation: Rattachement }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-4 rounded-carte border-2 border-dashed border-encre bg-jaune-clair p-5">
      <p className="min-w-0 flex-[1_1_16rem]">
        <span aria-hidden="true">💌 </span>
        {lierPonctuation("Tu es invité dans l'équipe de ")}
        <strong className="[overflow-wrap:anywhere]">{invitation.nom}</strong>
        {` (${invitation.ville}).`}
      </p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <BoutonRattachement rattachementId={invitation.id} geste="accepter" texte="Accepter" precision={`l'invitation de ${invitation.nom}`} principal />
        <BoutonRattachement rattachementId={invitation.id} geste="retirer" texte="Refuser" precision={`l'invitation de ${invitation.nom}`} />
      </div>
    </li>
  );
}
