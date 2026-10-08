import * as Location from "expo-location";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { AGE_POSITION_MAX_MS, PRECISION_MAX_M } from "@sos-miam/commun/regles/visites";
import type { PositionLieu } from "@sos-miam/commun/types/lieu";
import type { LecturePosition } from "@sos-miam/commun/types/position";
import { creerPositionDemo } from "~/fonctions/demo/creer-position-demo";
import { utiliserReglagesDemo } from "~/hooks/utiliser-reglages-demo";
import { utiliserServices } from "~/hooks/utiliser-services";

export type ResultatLecturePosition =
  | { ok: true; position: LecturePosition }
  | { ok: false; erreur: "position-refusee" | "position-bloquee" | "position-coupee" | "position-introuvable" | "position-approximative" };

// Une lecture fraîche et précise, sans attendre plus de 15 secondes ; sinon la dernière connue, si elle est récente et assez précise
const DELAI_LECTURE_MAX = 15_000;

/** Lit la position du téléphone pour valider une visite : précise, récente, avec son imprécision et si elle est simulée. */
async function lirePositionTelephone(): Promise<ResultatLecturePosition> {
  let minuterie: ReturnType<typeof setTimeout> | undefined;
  try {
    // Localisation coupée : sur iPhone, la demande d'accès répondrait « refusé » ; on le dit d'abord
    if (!(await Location.hasServicesEnabledAsync())) return { ok: false, erreur: "position-coupee" };
    // Lu avant de demander : sur iPhone, un premier « Ne pas autoriser » répond déjà « ne redemande plus » ;
    // seul un refus d'avant renvoie vers les réglages du téléphone
    const avant = await Location.getForegroundPermissionsAsync();
    if (!avant.granted && !avant.canAskAgain) return { ok: false, erreur: "position-bloquee" };
    const acces = avant.granted ? avant : await Location.requestForegroundPermissionsAsync();
    if (!acces.granted) return { ok: false, erreur: "position-refusee" };
    // « Position exacte » coupée (iPhone) ou position approximative (Android) : trop flou pour dire que tu es sur place
    if (acces.ios?.accuracy === "reduced" || acces.android?.accuracy === "coarse") return { ok: false, erreur: "position-approximative" };

    const fraiche = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).catch(() => null),
      new Promise<null>((resoudre) => {
        minuterie = setTimeout(() => resoudre(null), DELAI_LECTURE_MAX);
      }),
    ]);
    const lue =
      fraiche ??
      (await Location.getLastKnownPositionAsync({ maxAge: AGE_POSITION_MAX_MS, requiredAccuracy: PRECISION_MAX_M }).catch(() => null));
    if (!lue) return { ok: false, erreur: "position-introuvable" };
    return {
      ok: true,
      position: {
        latitude: lue.coords.latitude,
        longitude: lue.coords.longitude,
        precision: lue.coords.accuracy ?? null,
        // L'âge de la lecture, jamais l'heure du téléphone : changer l'heure ne sert à rien
        ageMs: Math.max(0, Math.round(Date.now() - lue.timestamp)),
        // Android seulement ; l'iPhone ne dit rien
        simulee: lue.mocked === true,
      },
    };
  } catch {
    return { ok: false, erreur: "position-introuvable" };
  } finally {
    if (minuterie) clearTimeout(minuterie);
  }
}

/**
 * Position du téléphone au moment de valider une visite (addition, QR du comptoir, « Je suis là », mission sur place).
 * Lue seulement quand on la demande, rendue telle quelle et jamais gardée ici. En démo, sans « Vérifier ma vraie position »
 * (Coulisses), le téléphone est placé à 30 m du lieu visé.
 */
export function utiliserPositionValidation(): {
  lire: (cible: PositionLieu | null) => Promise<ResultatLecturePosition>;
  enCours: boolean;
} {
  const { source } = utiliserServices();
  const { reglages } = utiliserReglagesDemo();
  const [enCours, setEnCours] = useState(false);

  // Lu au moment de la lecture : la fonction rendue ne change pas quand on touche aux Coulisses
  const vraiePosition = useRef(reglages.vraiePosition);
  useLayoutEffect(() => {
    vraiePosition.current = reglages.vraiePosition;
  }, [reglages.vraiePosition]);

  const monte = useRef(true);
  useEffect(() => {
    monte.current = true;
    return () => {
      monte.current = false;
    };
  }, []);

  const lire = useCallback(
    async (cible: PositionLieu | null): Promise<ResultatLecturePosition> => {
      if (source === "demo" && !vraiePosition.current && cible) return { ok: true, position: creerPositionDemo(cible) };
      setEnCours(true);
      try {
        return await lirePositionTelephone();
      } finally {
        if (monte.current) setEnCours(false);
      }
    },
    [source],
  );

  return { lire, enCours };
}
