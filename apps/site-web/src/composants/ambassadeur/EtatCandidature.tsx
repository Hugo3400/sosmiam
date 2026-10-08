import { useEffect, useRef } from "react";

import { DateEnLettres } from "~/composants/ambassadeur/DateEnLettres";
import { Ecusson } from "~/composants/marque/Ecusson";
import { Mascotte } from "~/composants/marque/Mascotte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { CandidatureFondateur } from "~/types/compte";

type Props = {
  candidature: CandidatureFondateur;
  /** Vrai juste après l'envoi : le focus passe au titre, que les lecteurs d'écran lisent aussitôt */
  vientDArriver?: boolean;
};

/** Où en est la candidature « fondateur » : à l'étude, acceptée (avec le numéro de carte) ou non retenue. */
export function EtatCandidature({ candidature, vientDArriver = false }: Props) {
  const titre = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (vientDArriver) titre.current?.focus();
  }, [vientDArriver]);

  if (candidature.statut === "acceptee") {
    return (
      <div className="rounded-carte border-2 border-encre bg-jaune px-6 py-10 text-center shadow-brut-grand md:px-12">
        <Ecusson ruban="FONDATEUR" className="mx-auto mb-5 h-28 w-28 -rotate-6" />
        <h2 ref={titre} tabIndex={-1} className="text-3xl font-extrabold">{lierPonctuation("Bienvenue chez les fondateurs !")}</h2>
        <p className="mx-auto mt-3 max-w-lg text-lg">
          {candidature.numero
            ? lierPonctuation(`Tu fais partie des 10 ambassadeurs fondateurs de SOS Miam. Ta carte porte le numéro ${candidature.numero}.`)
            : "Tu fais partie des 10 ambassadeurs fondateurs de SOS Miam."}
        </p>
      </div>
    );
  }

  if (candidature.statut === "refusee") {
    return (
      <div className="rounded-carte border-2 border-encre bg-white px-6 py-10 shadow-brut md:px-12">
        <h2 ref={titre} tabIndex={-1} className="text-3xl font-extrabold">Ta candidature n'a pas été retenue</h2>
        <p className="mt-3 max-w-xl text-lg">
          {lierPonctuation("Merci d'avoir tenté ta chance ! Les places de fondateur sont très peu nombreuses. Tu restes ambassadeur et tu grimpes les niveaux, comme tout le monde.")}
        </p>
        {candidature.reponduLe && (
          <p className="mt-3 max-w-xl text-gris">
            Ta candidature sera effacée le <DateEnLettres iso={candidature.reponduLe} plusMois={3} />, trois mois après la réponse.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-carte border-2 border-encre bg-white px-6 py-10 text-center shadow-brut md:px-12">
      <Mascotte expression="clin" className="mx-auto mb-5 h-24 w-24" />
      <h2 ref={titre} tabIndex={-1} className="text-3xl font-extrabold">Ta candidature est bien arrivée</h2>
      <p className="mx-auto mt-3 max-w-lg text-lg">
        Envoyée le <DateEnLettres iso={candidature.creeLe} />. {lierPonctuation("L'équipe la lit avec attention : tu verras sa réponse ici.")}
      </p>
    </div>
  );
}
