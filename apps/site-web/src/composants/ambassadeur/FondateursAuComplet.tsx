import { useEffect, useRef } from "react";

import { Mascotte } from "~/composants/marque/Mascotte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  /** Vrai juste après un envoi refusé faute de place : le formulaire vient de disparaître, le focus passe au titre */
  apresEnvoi?: boolean;
};

/**
 * Les 10 places de fondateur sont prises (10 numéros donnés) : à la place de la présentation et du formulaire de
 * candidature. Une place se libère si un fondateur quitte le programme : le formulaire revient alors tout seul.
 */
export function FondateursAuComplet({ apresEnvoi = false }: Props) {
  const titre = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (apresEnvoi) titre.current?.focus();
  }, [apresEnvoi]);

  return (
    <div className="rounded-carte border-2 border-encre bg-white px-6 py-10 text-center shadow-brut md:px-12">
      <Mascotte expression="clin" className="mx-auto mb-5 h-24 w-24" />
      <h2 ref={titre} tabIndex={-1} className="text-3xl font-extrabold">Les 10 places sont prises</h2>
      <p className="mx-auto mt-3 max-w-lg text-lg">
        {lierPonctuation("Merci à toutes celles et ceux qui ont tenté leur chance ! Tu restes ambassadeur et tu grimpes les niveaux, comme tout le monde.")}
      </p>
    </div>
  );
}
