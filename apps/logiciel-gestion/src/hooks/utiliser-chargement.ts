import { useCallback, useEffect, useRef, useState } from "react";

import { ErreurApi } from "~/services/client-gestion.ts";

export type Chargement<T> = {
  donnees: T | null;
  erreur: ErreurApi | null;
  chargement: boolean;
  recharger: () => void;
};

/** Charge des données depuis l'API, et les recharge quand les dépendances changent. Ignore les réponses dépassées. */
export function utiliserChargement<T>(charger: () => Promise<T>, dependances: unknown[]): Chargement<T> {
  const [etat, setEtat] = useState<{ donnees: T | null; erreur: ErreurApi | null; chargement: boolean }>({ donnees: null, erreur: null, chargement: true });
  const numero = useRef(0);
  const [tour, setTour] = useState(0);
  const chargerMemo = useCallback(charger, dependances);

  useEffect(() => {
    const ceNumero = ++numero.current;
    setEtat((avant) => ({ ...avant, chargement: true, erreur: null }));
    chargerMemo().then(
      (donnees) => ceNumero === numero.current && setEtat({ donnees, erreur: null, chargement: false }),
      (erreur: unknown) =>
        ceNumero === numero.current &&
        setEtat((avant) => ({ ...avant, erreur: erreur instanceof ErreurApi ? erreur : new ErreurApi("erreur-inattendue", 0), chargement: false })),
    );
  }, [chargerMemo, tour]);

  return { ...etat, recharger: useCallback(() => setTour((t) => t + 1), []) };
}
