import { useCallback, useMemo, useState, type ReactNode } from "react";

import type { CategorieEnvie } from "@sos-miam/commun/types/profil";
import { ContexteBrouillon, type BrouillonInscription } from "~/hooks/utiliser-brouillon-inscription";

const brouillonVide: BrouillonInscription = { prenom: "", nom: "", dateNaissance: null, ville: null, envies: {} };

/** Garde en mémoire ce que la personne remplit d'un écran d'inscription à l'autre. */
export function FournisseurBrouillon({ children }: { children: ReactNode }) {
  const [brouillon, setBrouillon] = useState(brouillonVide);

  const modifier = useCallback((changements: Partial<BrouillonInscription>) => {
    setBrouillon((actuel) => ({ ...actuel, ...changements }));
  }, []);

  const basculerEnvie = useCallback((categorie: CategorieEnvie, id: string) => {
    setBrouillon((actuel) => {
      const coches = actuel.envies[categorie] ?? [];
      const suivants = coches.includes(id) ? coches.filter((c) => c !== id) : [...coches, id];
      return { ...actuel, envies: { ...actuel.envies, [categorie]: suivants } };
    });
  }, []);

  const valeur = useMemo(() => ({ brouillon, modifier, basculerEnvie }), [brouillon, modifier, basculerEnvie]);
  return <ContexteBrouillon.Provider value={valeur}>{children}</ContexteBrouillon.Provider>;
}
