import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";

import { utiliserServices } from "~/hooks/utiliser-services";

/** Une position toutes les 15 secondes au plus (le serveur en accepte 12 par minute) */
const ECART_MIN_MS = 15_000;

export type EtatEnvoiPosition = "demarrage" | "envoi" | "refusee" | "erreur";

/**
 * Pendant un partage « Prévenir un pote » en cours : suit la position du téléphone (tous les 25 m, ou toutes les 20 s sur
 * Android) et l'envoie au serveur, TANT QUE L'ÉCRAN EST OUVERT (l'app ne demande la position que « pendant l'utilisation »).
 * `onTermine` : le serveur dit que le partage est fini (arrêté, l'heure passée, plus potes).
 */
export function utiliserEnvoiPositionMiamSafe(partageId: number | null, onTermine: () => void) {
  const { miamSafe } = utiliserServices();
  const [etat, setEtat] = useState<EtatEnvoiPosition>("demarrage");
  const [derniere, setDerniere] = useState<Date | null>(null);
  const finir = useRef(onTermine);
  finir.current = onTermine;

  useEffect(() => {
    if (partageId === null) return;
    let annule = false;
    let abonnement: Location.LocationSubscription | null = null;
    let dernierEnvoi = 0;
    (async () => {
      const acces = await Location.getForegroundPermissionsAsync().catch(() => null);
      const permis = acces?.granted ? acces : await Location.requestForegroundPermissionsAsync().catch(() => null);
      if (annule) return;
      if (!permis?.granted) return setEtat("refusee");
      abonnement = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 20_000, distanceInterval: 25 },
        async (lue) => {
          const maintenant = Date.now();
          if (annule || maintenant - dernierEnvoi < ECART_MIN_MS) return;
          dernierEnvoi = maintenant;
          const precision = lue.coords.accuracy;
          const r = await miamSafe
            .envoyerPosition(partageId, { latitude: lue.coords.latitude, longitude: lue.coords.longitude, precisionM: typeof precision === "number" ? Math.round(precision) : null })
            .catch(() => null);
          if (annule) return;
          if (r?.ok) {
            setDerniere(new Date());
            setEtat("envoi");
          } else if (r && (r.erreur === "partage-termine" || r.erreur === "partage-inconnu")) {
            abonnement?.remove();
            finir.current();
          } else {
            setEtat("erreur");
          }
        },
      ).catch(() => null);
      if (annule) abonnement?.remove();
      else if (!abonnement) setEtat("erreur");
    })();
    return () => {
      annule = true;
      abonnement?.remove();
    };
  }, [partageId, miamSafe]);

  return { etat, derniere };
}
