import { usePathname } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Annonce } from "~/composants/interface/Annonce";
import { ANNONCE_POSITION_OUBLIEE } from "~/contenus/textes-position";
import { utiliserPositionActuelle } from "~/hooks/utiliser-position-actuelle";

const FICHE_LIEU = /^\/lieu\/[^/]+$/;

export function AnnonceOubliPosition() {
  const { oubliApresAbsence, marquerOubliDit } = utiliserPositionActuelle();
  const chemin = usePathname();
  const marges = useSafeAreaInsets();
  const [oubliDit, setOubliDit] = useState<number | null>(null);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  if (oubliApresAbsence !== null && oubliApresAbsence !== oubliDit && FICHE_LIEU.test(chemin)) {
    setOubliDit(oubliApresAbsence);
    setAnnonce({ texte: ANNONCE_POSITION_OUBLIEE, numero: oubliApresAbsence });
  }
  useEffect(() => {
    if (oubliDit !== null) marquerOubliDit(oubliDit);
  }, [oubliDit, marquerOubliDit]);
  const finir = useCallback(() => setAnnonce(null), []);
  return <Annonce annonce={annonce} haut={marges.top + 60} onFin={finir} />;
}
