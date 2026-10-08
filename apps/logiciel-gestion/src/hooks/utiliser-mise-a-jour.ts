import { useEffect, useState } from "react";

import { chercherMiseAJour, type MiseAJour } from "~/services/mises-a-jour.ts";

/** Cherche une mise à jour à chaque connexion (une fois), sans jamais déranger si ça échoue. */
export function utiliserMiseAJour(connecte: boolean) {
  const [miseAJour, setMiseAJour] = useState<MiseAJour | null>(null);
  useEffect(() => {
    if (!connecte) return;
    let annule = false;
    chercherMiseAJour().then((trouvee) => !annule && setMiseAJour(trouvee), () => {});
    return () => {
      annule = true;
    };
  }, [connecte]);
  return miseAJour;
}
