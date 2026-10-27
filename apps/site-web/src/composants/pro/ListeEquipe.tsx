import { Form, useNavigation } from "react-router";

import { TEXTES_EQUIPE_PRO_PAR_LANGUE } from "~/contenus/equipe-pro";
import { TEXTES_FORMULAIRE_COMPTE_PAR_LANGUE } from "~/contenus/formulaire-compte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { MembreEquipe } from "~/types/pro";

/** Nom du formulaire « Retirer » (champ caché « formulaire ») : l'action de /lieu/:id/equipe y répond. */
export const FORMULAIRE_RETIRER = "retirer";

/** L'équipe d'un lieu : le ou les gérants, les membres et les invités ; « Retirer » pour un membre (formulaire POST). */
export function ListeEquipe({ equipe }: { equipe: MembreEquipe[] }) {
  const navigation = useNavigation();
  const T = utiliserTextes(TEXTES_EQUIPE_PRO_PAR_LANGUE).liste;
  const envoi = utiliserTextes(TEXTES_FORMULAIRE_COMPTE_PAR_LANGUE).envoi;
  return (
    <ul className="grid gap-3">
      {equipe.map((membre) => {
        const enCours = navigation.state !== "idle" && navigation.formData?.get("compteId") === String(membre.compteId);
        return (
          <li key={membre.compteId} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl border-2 border-encre bg-white px-5 py-4">
            <div className="min-w-0">
              <p className="font-semibold [overflow-wrap:anywhere]">
                {membre.prenom}
                <span className="ml-2 text-sm font-normal text-gris">{membre.role === "gerant" ? T.gerant : membre.statut === "valide" ? T.equipe : T.invite}</span>
              </p>
              {membre.email && <p className="text-sm text-gris [overflow-wrap:anywhere]">{membre.email}</p>}
            </div>
            {membre.role === "equipe" && (
              <Form method="post">
                <input type="hidden" name="formulaire" value={FORMULAIRE_RETIRER} />
                <input type="hidden" name="compteId" value={membre.compteId} />
                <button
                  type="submit"
                  className="text-sm font-semibold underline decoration-rouge-texte/40 decoration-2 underline-offset-4 hover:decoration-rouge-texte
                    focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre"
                >
                  {enCours ? envoi : <>{membre.statut === "valide" ? T.retirer : T.annulerInvitation}<span className="sr-only">{lierPonctuation(T.precision(membre.prenom))}</span></>}
                </button>
              </Form>
            )}
          </li>
        );
      })}
    </ul>
  );
}
