import { useEffect, useState } from "react";

import type { EspaceAmbassadeur } from "@sos-miam/commun/types/espace-ambassadeur";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { utiliserServices } from "~/hooks/utiliser-services";

/** Les compteurs de l'espace ambassadeur (missions à faire, avis à relire, messages non lus), relus quand les services changent. */
export function utiliserEspaceAmbassadeur(): { espace: EspaceAmbassadeur | null; erreur: ErreurService | null } {
  const { ambassadeur } = utiliserServices();
  const [espace, setEspace] = useState<EspaceAmbassadeur | null>(null);
  const [erreur, setErreur] = useState<ErreurService | null>(null);

  useEffect(() => {
    let actif = true;
    const lire = () =>
      ambassadeur.lireEspace().then((r) => {
        if (!actif) return;
        if (r.ok) {
          setEspace(r.espace);
          setErreur(null);
        } else setErreur(r.erreur);
      });
    void lire();
    const desabonner = ambassadeur.ecouter(lire);
    return () => {
      actif = false;
      desabonner();
    };
  }, [ambassadeur]);

  return { espace, erreur };
}
