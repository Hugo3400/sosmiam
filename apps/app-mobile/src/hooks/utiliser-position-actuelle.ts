import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";

import type { PositionLieu } from "@sos-miam/commun/types/lieu";

/** « refus » : non pour cette fois ; « refus-definitif » : il faut passer par les réglages du téléphone ; « coupee » : localisation éteinte */
export type ErreurPosition = "refus" | "refus-definitif" | "coupee" | "introuvable";

// Une position récente suffit ; sinon on en demande une, sans attendre plus de 12 secondes
const AGE_MAX_POSITION = 2 * 60 * 1000;
const DELAI_MAX = 12_000;

/**
 * Position du téléphone pour « Autour de moi » (Explorer) : demandée seulement quand on touche le bouton,
 * gardée en mémoire le temps de l'écran, jamais enregistrée ni envoyée.
 */
export function utiliserPositionActuelle() {
  const [position, setPosition] = useState<PositionLieu | null>(null);
  const [recherche, setRecherche] = useState(false);
  const monte = useRef(true);
  useEffect(() => {
    monte.current = true;
    return () => {
      monte.current = false;
    };
  }, []);

  const chercher = useCallback(async (): Promise<{ position: PositionLieu } | { erreur: ErreurPosition }> => {
    setRecherche(true);
    let minuterie: ReturnType<typeof setTimeout> | undefined;
    try {
      // Localisation coupée : sur iPhone, la demande d'accès répondrait « refusé » ; on le dit d'abord
      if (!(await Location.hasServicesEnabledAsync())) return { erreur: "coupee" };
      const acces = await Location.requestForegroundPermissionsAsync();
      if (!acces.granted) return { erreur: acces.canAskAgain ? "refus" : "refus-definitif" };
      const lue =
        (await Location.getLastKnownPositionAsync({ maxAge: AGE_MAX_POSITION })) ??
        (await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<null>((resoudre) => {
            minuterie = setTimeout(() => resoudre(null), DELAI_MAX);
          }),
        ]));
      if (!lue) return { erreur: "introuvable" };
      const trouvee = { latitude: lue.coords.latitude, longitude: lue.coords.longitude };
      if (monte.current) setPosition(trouvee);
      return { position: trouvee };
    } catch {
      return { erreur: "introuvable" };
    } finally {
      if (minuterie) clearTimeout(minuterie);
      if (monte.current) setRecherche(false);
    }
  }, []);

  /** Oublie la position (retour au tri par envies) */
  const oublier = useCallback(() => setPosition(null), []);

  return { position, recherche, chercher, oublier };
}
