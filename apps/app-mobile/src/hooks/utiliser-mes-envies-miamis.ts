import { useCallback, useEffect, useState } from "react";

import { enregistrerEnviesMiamis, lireEnviesMiamis } from "~/stockage/envies-miamis";

export function utiliserMesEnviesMiamis() {
  const [envies, setEnvies] = useState<string[]>([]);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    let actif = true;
    void lireEnviesMiamis().then((lues) => {
      if (!actif) return;
      setEnvies(lues);
      setPret(true);
    });
    return () => {
      actif = false;
    };
  }, []);

  const modifier = useCallback(async (nouvelles: string[]) => {
    setEnvies(nouvelles);
    await enregistrerEnviesMiamis(nouvelles).catch(() => undefined);
  }, []);

  return { envies, pret, modifier };
}
