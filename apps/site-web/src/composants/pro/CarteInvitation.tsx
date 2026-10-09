import { Form, useNavigation } from "react-router";

import { Bouton } from "~/composants/interface/Bouton";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { LieuDuCompte } from "~/types/pro";

/** Nom du formulaire « Accepter » (champ caché « formulaire ») : l'action de /tableau y répond. */
export const FORMULAIRE_ACCEPTER = "accepter-invitation";

/** Une invitation reçue à rejoindre l'équipe d'un lieu, à accepter (formulaire POST : marche sans JavaScript). */
export function CarteInvitation({ lieu }: { lieu: LieuDuCompte }) {
  const navigation = useNavigation();
  const enCours = navigation.state === "submitting" && navigation.formData?.get("rattachementId") === String(lieu.rattachementId);
  return (
    <li className="flex flex-wrap items-center justify-between gap-4 rounded-carte border-2 border-dashed border-encre bg-jaune-clair p-5">
      <p className="min-w-0 flex-[1_1_16rem]">
        <span aria-hidden="true">💌 </span>
        {lierPonctuation("Tu es invité dans l'équipe de ")}
        <strong className="[overflow-wrap:anywhere]">{lieu.nom}</strong>
        {` (${lieu.ville}).`}
      </p>
      <Form method="post">
        <input type="hidden" name="formulaire" value={FORMULAIRE_ACCEPTER} />
        <input type="hidden" name="rattachementId" value={lieu.rattachementId} />
        <Bouton type="submit" petit>
          {enCours ? "Envoi…" : <>Accepter<span className="sr-only">{` l'invitation de ${lieu.nom}`}</span></>}
        </Bouton>
      </Form>
    </li>
  );
}
