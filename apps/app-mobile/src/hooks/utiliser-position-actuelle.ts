import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import type { PositionLieu } from "@sos-miam/commun/types/lieu";

/**
 * « refus » : la personne vient de dire non ; « refus-definitif » : elle avait déjà dit non et le téléphone ne redemande plus
 * (seuls ses réglages peuvent changer ça) ; « coupee » : localisation éteinte ; « introuvable » : pas de position pour l'instant
 */
export type ErreurPosition = "refus" | "refus-definitif" | "coupee" | "introuvable";

// Une position récente suffit ; sinon on en demande une, sans attendre plus de 12 secondes
const AGE_MAX_POSITION = 2 * 60 * 1000;
const DELAI_MAX = 12_000;

/**
 * Position du téléphone pour « Autour de moi » (Explorer) : demandée seulement quand on touche le bouton,
 * gardée en mémoire tant que l'app reste ouverte (oubliée dès qu'elle passe en arrière-plan), jamais enregistrée ni envoyée.
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

  // L'app passe en arrière-plan : on oublie la position (il faudra retoucher « Autour de moi » au retour)
  useEffect(() => {
    const abonnement = AppState.addEventListener("change", (etat) => {
      if (etat === "background") setPosition(null);
    });
    return () => abonnement.remove();
  }, []);

  const chercher = useCallback(async (): Promise<{ position: PositionLieu } | { erreur: ErreurPosition }> => {
    setRecherche(true);
    let minuterie: ReturnType<typeof setTimeout> | undefined;
    try {
      // Localisation coupée : sur iPhone, la demande d'accès répondrait « refusé » ; on le dit d'abord
      if (!(await Location.hasServicesEnabledAsync())) return { erreur: "coupee" };
      // Lu avant de demander : sur iPhone, un premier « Ne pas autoriser » répond déjà « ne redemande plus »,
      // alors que la personne vient juste de dire non ; seul un refus d'avant renvoie vers les réglages
      const avant = await Location.getForegroundPermissionsAsync();
      if (!avant.granted && !avant.canAskAgain) return { erreur: "refus-definitif" };
      const acces = await Location.requestForegroundPermissionsAsync();
      if (!acces.granted) return { erreur: "refus" };
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
