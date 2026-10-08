import { useEffect } from "react";

import { notifier } from "~/services/systeme.ts";
import { lireStatistiques } from "~/services/statistiques.ts";

const CLE = "sosmiam-gestion:dernier-resume";

/**
 * Résumé de la semaine écoulée, en notification Windows, à la première connexion de chaque semaine (le lundi, ou plus
 * tard si le logiciel n'a pas été ouvert) : visiteurs, évolution, inscrits et demandes de lieux.
 */
export function utiliserResumeSemaine(actif: boolean) {
  useEffect(() => {
    if (!actif) return;
    let annule = false;
    lireStatistiques("site", "semaine", 2).then(
      ({ periodes, precedentes, conversions }) => {
        const semaineEnCours = periodes[1]?.cle;
        const ecoulee = periodes[0];
        if (annule || !semaineEnCours || !ecoulee) return;
        try {
          if (localStorage.getItem(CLE) === semaineEnCours) return;
          localStorage.setItem(CLE, semaineEnCours);
        } catch {
          return;
        }
        const avant = precedentes[1]?.visiteurs ?? 0;
        const evolution = avant ? ` (${ecoulee.visiteurs >= avant ? "+" : ""}${Math.round(((ecoulee.visiteurs - avant) / avant) * 100)} %)` : "";
        const { inscriptions = 0, demandes = 0 } = conversions[0] ?? {};
        void notifier(
          "📊 Ta semaine SOS Miam",
          `${ecoulee.visiteurs} visiteur(s)${evolution}, ${ecoulee.vues} pages vues, ${inscriptions} inscrit(s) à la newsletter, ${demandes} demande(s) de lieu.`,
        );
      },
      () => {},
    );
    return () => {
      annule = true;
    };
  }, [actif]);
}
