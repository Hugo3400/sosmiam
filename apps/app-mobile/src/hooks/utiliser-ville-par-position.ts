import * as Location from "expo-location";
import { useCallback, useState } from "react";

import { villesLancement } from "~/contenus/inscription/villes";
import { extraireNomVille } from "~/fonctions/geo/extraire-nom-ville";
import { nettoyerNomVille } from "~/fonctions/texte/nettoyer-nom-ville";

/** « refus » : la personne a dit non ; « coupee » : localisation éteinte ; « introuvable » : pas de position ou pas de ville */
export type ResultatVilleParPosition = { ville: string } | { erreur: "refus" | "coupee" | "introuvable" };

// Une position récente suffit pour trouver une ville ; sinon on en demande une, sans attendre plus de 12 secondes
const AGE_MAX_POSITION = 10 * 60 * 1000;
const DELAI_MAX = 12_000;

/**
 * Trouve la ville où l'on se trouve, à partir de la position du téléphone lue une seule fois.
 * La position n'est ni gardée ni envoyée à SOS Miam : seul le nom de la ville est renvoyé.
 */
export function utiliserVilleParPosition() {
  const [recherche, setRecherche] = useState(false);

  const chercherVille = useCallback(async (): Promise<ResultatVilleParPosition> => {
    setRecherche(true);
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) return { erreur: "refus" };
      if (!(await Location.hasServicesEnabledAsync())) return { erreur: "coupee" };
      const position =
        (await Location.getLastKnownPositionAsync({ maxAge: AGE_MAX_POSITION })) ??
        (await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<null>((resoudre) => setTimeout(() => resoudre(null), DELAI_MAX)),
        ]));
      if (!position) return { erreur: "introuvable" };
      const [adresse] = await Location.reverseGeocodeAsync({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      const nom = adresse ? extraireNomVille(adresse) : null;
      return nom ? { ville: nettoyerNomVille(nom, villesLancement) } : { erreur: "introuvable" };
    } catch {
      return { erreur: "introuvable" };
    } finally {
      setRecherche(false);
    }
  }, []);

  return { chercherVille, recherche };
}
