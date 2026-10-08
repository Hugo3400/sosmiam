import * as Location from "expo-location";
import { useCallback, useState } from "react";

import { villesLancement } from "~/contenus/inscription/villes";
import { extraireNomVille } from "~/fonctions/geo/extraire-nom-ville";
import { nettoyerNomVille } from "~/fonctions/texte/nettoyer-nom-ville";
import { verifierNomVille } from "~/fonctions/texte/verifier-nom-ville";

/**
 * « refus » : la personne vient de dire non ; « refus-definitif » : elle avait déjà dit non et le téléphone ne redemande plus
 * (seuls ses réglages peuvent changer ça) ; « coupee » : localisation éteinte ; « introuvable » : pas de position ou pas de ville
 */
export type ResultatVilleParPosition = { ville: string } | { erreur: "refus" | "refus-definitif" | "coupee" | "introuvable" };

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
      // D'abord la localisation du téléphone : sur iPhone, quand elle est coupée, la demande répond « refusé » sans rien afficher
      if (!(await Location.hasServicesEnabledAsync())) return { erreur: "coupee" };
      // Lu avant de demander : sur iPhone, après un premier « Ne pas autoriser », la fenêtre ne s'affiche plus jamais
      const avant = await Location.getForegroundPermissionsAsync();
      if (!avant.granted && !avant.canAskAgain) return { erreur: "refus-definitif" };
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) return { erreur: "refus" };
      const position =
        (await Location.getLastKnownPositionAsync({ maxAge: AGE_MAX_POSITION })) ??
        (await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<null>((resoudre) => setTimeout(() => resoudre(null), DELAI_MAX)),
        ]));
      if (!position) return { erreur: "introuvable" };
      const [adresse] = await Location.reverseGeocodeAsync({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      const nom = adresse ? extraireNomVille(adresse) : null;
      const ville = nom ? nettoyerNomVille(nom, villesLancement) : null;
      // Même règle que pour une ville tapée à la main (un nom avec des chiffres ne passerait pas le champ)
      return ville && verifierNomVille(ville) === "valable" ? { ville } : { erreur: "introuvable" };
    } catch {
      return { erreur: "introuvable" };
    } finally {
      setRecherche(false);
    }
  }, []);

  return { chercherVille, recherche };
}
