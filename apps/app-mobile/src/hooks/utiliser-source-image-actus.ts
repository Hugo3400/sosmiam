import { useEffect, useState } from "react";
import type { ImageSourcePropType } from "react-native";

import { utiliserServiceActus } from "~/hooks/utiliser-service-actus";
import { ADRESSE_API } from "~/services/adresse-api";

export function utiliserSourceImageActus(valeur: string | null): ImageSourcePropType | null {
  const { client } = utiliserServiceActus();
  const prive = valeur?.startsWith("/") ?? false;
  const [entetes, setEntetes] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    if (!prive) return;
    let actif = true;
    void client.preparerTelechargement("/app/actus/miens").then(({ entetes: lues }) => {
      if (actif) setEntetes(lues);
    });
    return () => {
      actif = false;
    };
  }, [client, prive]);

  if (!valeur) return null;
  if (!prive) return { uri: valeur };
  return entetes ? { uri: `${ADRESSE_API}${valeur}`, headers: entetes } : null;
}
