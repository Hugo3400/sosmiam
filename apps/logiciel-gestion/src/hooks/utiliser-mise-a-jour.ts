import { useEffect, useState } from "react";

import { chercherMiseAJour, type MiseAJour } from "~/services/mises-a-jour.ts";
import { notifier } from "~/services/systeme.ts";

/** Cherche une mise à jour à chaque connexion (une fois), sans jamais déranger si ça échoue. */
export function utiliserMiseAJour(connecte: boolean) {
  const [miseAJour, setMiseAJour] = useState<MiseAJour | null>(null);
  useEffect(() => {
    if (!connecte) return;
    let annule = false;
    chercherMiseAJour().then((trouvee) => {
      if (annule || !trouvee) return;
      setMiseAJour(trouvee);
      void notifier("🎁 Mise à jour du logiciel", `La version ${trouvee.version} est prête : installe-la depuis le bandeau jaune, en haut du logiciel.`);
    }, () => {});
    return () => {
      annule = true;
    };
  }, [connecte]);
  return miseAJour;
}
