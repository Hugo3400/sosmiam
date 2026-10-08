import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppState } from "react-native";

import type { CategorieEnvie } from "@sos-miam/commun/types/profil";
import { ContexteBrouillon, type BrouillonInscription } from "~/hooks/utiliser-brouillon-inscription";
import { leverVerrouAge, lireVerrouAge, poserVerrouAge } from "~/stockage/verrou-age";

const brouillonVide: BrouillonInscription = { prenom: "", nom: "", dateNaissance: null, ville: null, envies: {} };

/** Garde en mémoire ce que la personne remplit d'un écran d'inscription à l'autre, et le verrou d'âge de ce téléphone. */
export function FournisseurBrouillon({ children }: { children: ReactNode }) {
  const [brouillon, setBrouillon] = useState(brouillonVide);
  const [verrouAge, setVerrouAge] = useState<string | null>(null);
  const [verrouEnLecture, setVerrouEnLecture] = useState(true);

  // Lu au lancement, puis relu à chaque retour au premier plan : l'app peut dormir en arrière-plan jusqu'au jour des 15 ans
  useEffect(() => {
    const relire = () =>
      lireVerrouAge().then((jusqua) => {
        setVerrouAge(jusqua);
        setVerrouEnLecture(false);
      });
    relire();
    const abonnement = AppState.addEventListener("change", (etat) => {
      if (etat === "active") relire();
    });
    return () => abonnement.remove();
  }, []);

  const bloquer = useCallback((jusqua: string) => {
    setVerrouAge((actuel) => (actuel && actuel >= jusqua ? actuel : jusqua));
    poserVerrouAge(jusqua).catch(() => {});
  }, []);

  const debloquer = useCallback(() => {
    if (!__DEV__) return;
    setVerrouAge(null);
    leverVerrouAge().catch(() => {});
  }, []);

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

  const valeur = useMemo(
    () => ({ brouillon, modifier, basculerEnvie, verrouAge, verrouEnLecture, bloquer, debloquer }),
    [brouillon, modifier, basculerEnvie, verrouAge, verrouEnLecture, bloquer, debloquer],
  );
  return <ContexteBrouillon.Provider value={valeur}>{children}</ContexteBrouillon.Provider>;
}
