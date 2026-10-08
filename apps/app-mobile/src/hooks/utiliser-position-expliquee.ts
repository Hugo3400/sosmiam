import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";

import type { PositionLieu } from "@sos-miam/commun/types/lieu";
import type { FeuillePositionVisite } from "~/composants/visites/FeuillePositionVisite";
import { utiliserPositionValidation, type ResultatLecturePosition } from "~/hooks/utiliser-position-validation";
import { enregistrerExplicationPositionVue, lireExplicationPositionVue } from "~/stockage/explication-position-vue";

/** « Pas maintenant » sur l'explication : rien n'a été lu, il n'y a rien à dire de plus */
export type LecturePositionExpliquee = ResultatLecturePosition | { ok: false; erreur: "annulee" };

/**
 * Lit la position pour valider une visite, en expliquant d'abord pourquoi la toute première fois (« Petite vérif' de
 * position », FeuillePositionVisite, à poser dans l'écran avec `propsFeuille`). Rend « annulee » si la personne préfère
 * ne pas, sans rien lire. `lire` reste la même d'un rendu à l'autre. La position n'est jamais gardée ici.
 */
export function utiliserPositionExpliquee(): {
  lire: (cible: PositionLieu | null, lieuNom: string | null) => Promise<LecturePositionExpliquee>;
  propsFeuille: ComponentProps<typeof FeuillePositionVisite>;
  enCours: boolean;
} {
  const { lire: lirePosition, enCours } = utiliserPositionValidation();
  // Le nom reste après la fermeture : le texte ne change pas pendant que la feuille descend
  const [feuille, setFeuille] = useState<{ visible: boolean; lieuNom: string | null }>({ visible: false, lieuNom: null });
  // La réponse attendue de la feuille ouverte (une seule à la fois)
  const reponse = useRef<((acceptee: boolean) => void) | null>(null);

  const repondre = useCallback((acceptee: boolean) => {
    const resoudre = reponse.current;
    reponse.current = null;
    setFeuille((f) => ({ ...f, visible: false }));
    resoudre?.(acceptee);
  }, []);

  // L'écran se ferme pendant que la feuille attend : c'est comme « Pas maintenant »
  useEffect(
    () => () => {
      reponse.current?.(false);
      reponse.current = null;
    },
    [],
  );

  const lire = useCallback(
    async (cible: PositionLieu | null, lieuNom: string | null): Promise<LecturePositionExpliquee> => {
      if (!(await lireExplicationPositionVue())) {
        // Une explication déjà ouverte (deux appuis rapides) : l'ancienne demande s'arrête là
        reponse.current?.(false);
        const acceptee = await new Promise<boolean>((resoudre) => {
          reponse.current = resoudre;
          setFeuille({ visible: true, lieuNom });
        });
        if (!acceptee) return { ok: false, erreur: "annulee" };
        await enregistrerExplicationPositionVue();
      }
      return lirePosition(cible);
    },
    [lirePosition],
  );

  const propsFeuille = useMemo(
    () => ({
      visible: feuille.visible,
      lieuNom: feuille.lieuNom,
      onAccepter: () => repondre(true),
      onRefuser: () => repondre(false),
    }),
    [feuille, repondre],
  );

  return { lire, propsFeuille, enCours };
}
