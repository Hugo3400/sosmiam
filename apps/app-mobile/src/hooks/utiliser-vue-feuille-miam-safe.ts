import { useCallback, useState } from "react";

import type { StatutAlerteMiamSafe } from "@sos-miam/commun/types/miam-safe";
import type { VueAideMiamSafe } from "~/composants/miam-safe/ChoixAideMiamSafe";
import type { AlerteGardeeMiamSafe } from "~/services/memoire-alertes-miam-safe";

export type VueFeuilleMiamSafe = "choix" | VueAideMiamSafe;

export type EtatVueFeuilleMiamSafe = {
  vue: VueFeuilleMiamSafe;
  renvoi: StatutAlerteMiamSafe | null;
  aller: (vue: VueFeuilleMiamSafe) => void;
  renvoyer: (statut: StatutAlerteMiamSafe | null) => void;
};

export function utiliserVueFeuilleMiamSafe(visible: boolean, alerte: AlerteGardeeMiamSafe | null): EtatVueFeuilleMiamSafe {
  const [vue, setVue] = useState<VueFeuilleMiamSafe>("choix");
  const [renvoi, setRenvoi] = useState<StatutAlerteMiamSafe | null>(null);
  const [ouverte, setOuverte] = useState(false);
  const [avecAlerte, setAvecAlerte] = useState(alerte !== null);

  if (visible !== ouverte) {
    setOuverte(visible);
    if (visible) {
      setVue("choix");
      setRenvoi(null);
    }
  }

  if (renvoi !== null && renvoi !== "en-route" && alerte?.statut === "en-route") setRenvoi(null);

  if ((alerte !== null) !== avecAlerte) {
    setAvecAlerte(alerte !== null);
    if (alerte === null) {
      if (vue === "alerte" && renvoi === null) setVue("choix");
      setRenvoi(null);
    }
  }

  const aller = useCallback((suivante: VueFeuilleMiamSafe) => {
    setVue(suivante);
    setRenvoi(null);
  }, []);

  return { vue, renvoi, aller, renvoyer: setRenvoi };
}
