import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import type { Profil } from "@sos-miam/commun/types/profil";
import { ContexteProfil } from "~/hooks/utiliser-profil";
import { effacerProfilLocal, enregistrerProfilLocal, lireProfilLocal } from "~/stockage/profil-local";

/** Lit le profil au démarrage et le met à disposition de toute l'app (voir utiliserProfil). */
export function FournisseurProfil({ children }: { children: ReactNode }) {
  const [profil, setProfil] = useState<Profil | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    lireProfilLocal().then((lu) => {
      setProfil(lu);
      setChargement(false);
    });
  }, []);

  const enregistrer = useCallback(async (nouveau: Profil) => {
    await enregistrerProfilLocal(nouveau);
    setProfil(nouveau);
  }, []);

  const effacer = useCallback(async () => {
    await effacerProfilLocal();
    setProfil(null);
  }, []);

  const valeur = useMemo(() => ({ profil, chargement, enregistrer, effacer }), [profil, chargement, enregistrer, effacer]);
  return <ContexteProfil.Provider value={valeur}>{children}</ContexteProfil.Provider>;
}
