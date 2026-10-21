import { usePathname } from "expo-router";
import { useCallback, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Annonce } from "~/composants/interface/Annonce";
import { ANNONCE_POSITION_OUBLIEE } from "~/contenus/textes-position";
import { utiliserPositionActuelle } from "~/hooks/utiliser-position-actuelle";

const FICHE_LIEU = /^\/lieu\/[^/]+$/;

export function AnnonceOubliPosition() {
  const { oubliApresAbsence } = utiliserPositionActuelle();
  const chemin = usePathname();
  const marges = useSafeAreaInsets();
  const [oubliVu, setOubliVu] = useState(oubliApresAbsence);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  if (oubliApresAbsence !== null && oubliApresAbsence !== oubliVu) {
    setOubliVu(oubliApresAbsence);
    if (FICHE_LIEU.test(chemin)) setAnnonce({ texte: ANNONCE_POSITION_OUBLIEE, numero: oubliApresAbsence });
  }
  const finir = useCallback(() => setAnnonce(null), []);
  return <Annonce annonce={annonce} haut={marges.top + 60} onFin={finir} />;
}
