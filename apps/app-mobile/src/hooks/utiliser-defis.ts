import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import type { DefiApp } from "@sos-miam/commun/types/defi";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { DefiAffiche } from "~/contenus/type-defi-affiche";
import { rangerDefis } from "~/fonctions/defis/ranger-defis";
import { utiliserRetoursPremierPlan } from "~/hooks/utiliser-retours-premier-plan";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserSession } from "~/hooks/utiliser-session";

export type DefisDuProfil = {
  /** Les défis à montrer, rangés (rangerDefis) ; null : pas encore lus, ou pas de compte */
  defis: DefiAffiche[] | null;
  /** La dernière lecture a raté ; les défis déjà lus restent montrés */
  erreur: ErreurService | null;
};

/**
 * Les défis du profil. Avec un compte : ceux du serveur (GET /app/defis), relus chaque fois que le profil revient à l'écran
 * ou que l'app revient au premier plan. Sans compte : rien (les défis demandent un compte).
 */
export function utiliserDefis(): DefisDuProfil {
  const { defis: service } = utiliserServices();
  const { connecte, rafraichir } = utiliserSession();
  const retours = utiliserRetoursPremierPlan();
  const avecCompte = connecte;
  const [lus, setLus] = useState<DefiApp[] | null>(null);
  const [erreur, setErreur] = useState<ErreurService | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!avecCompte) return;
      let actif = true;
      service.listerDefis().then((r) => {
        if (!actif) return;
        if (!r.ok) {
          setErreur(r.erreur);
          return;
        }
        setLus(r.defis);
        setErreur(null);
        void rafraichir();
      });
      return () => {
        actif = false;
      };
      // retours : relu aussi au retour au premier plan, si le profil est à l'écran
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [avecCompte, service, rafraichir, retours]),
  );

  const duServeur = useMemo(() => (lus ? rangerDefis(lus.map((d) => ({ ...d, attente: null }))) : null), [lus]);

  return avecCompte ? { defis: duServeur, erreur } : { defis: null, erreur: null };
}
