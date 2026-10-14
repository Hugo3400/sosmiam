import { useEffect, useRef, useState } from "react";

import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { convertirPersonneEnPote } from "~/fonctions/communaute/convertir-personne-en-pote";
import type { ResultatRecherchePote } from "~/fonctions/communaute/chercher-par-pseudo";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";

/** Le temps de finir de taper avant de demander au serveur */
const DELAI_RECHERCHE_MS = 300;

export type EtatRecherchePseudo = {
  resultats: ResultatRecherchePote[];
  /** Vrai pendant la demande au serveur (compte connecté) */
  enCours: boolean;
  /** La recherche n'a pas pu se faire (réseau, trop d'essais) ; null sinon */
  erreur: ErreurService | null;
};

/**
 * Chercher quelqu'un par le début de son pseudo (avec ou sans « @ », 2 lettres au moins), le pseudo exact en tête. Démo : dans
 * les potes d'exemple, tout de suite. Compte connecté : POST /app/personnes/recherche, 300 ms après la dernière frappe (le
 * texte part dans le corps, jamais dans l'adresse) ; une réponse arrivée après une frappe plus récente est ignorée. Les
 * personnes bloquées n'apparaissent jamais.
 */
export function utiliserRecherchePseudo(texte: string): EtatRecherchePseudo {
  const source = utiliserSourceSociale();
  const { sociaux } = utiliserSession();
  const { chercherParPseudo, trouverPote } = utiliserCommunaute();
  const cherche = texte.trim().replace(/^@/, "").toLowerCase();
  const [serveur, setServeur] = useState<EtatRecherchePseudo>({ resultats: [], enCours: false, erreur: null });
  const derniere = useRef(0);

  useEffect(() => {
    if (source !== "compte") return;
    const numero = ++derniere.current;
    if (cherche.length < 2) {
      setServeur({ resultats: [], enCours: false, erreur: null });
      return;
    }
    setServeur((avant) => ({ ...avant, enCours: true, erreur: null }));
    const minuterie = setTimeout(() => {
      void sociaux.social.chercher(cherche).then((r) => {
        // Une frappe plus récente a déjà relancé la recherche
        if (numero !== derniere.current) return;
        if (!r.ok) return setServeur({ resultats: [], enCours: false, erreur: r.erreur });
        setServeur({
          resultats: r.resultats.map(({ personne, pote }) => ({ pote: trouverPote(personne.id) ?? convertirPersonneEnPote(personne), dejaDansLaBande: pote })),
          enCours: false,
          erreur: null,
        });
      });
    }, DELAI_RECHERCHE_MS);
    return () => clearTimeout(minuterie);
    // trouverPote change à chaque relecture de la bande : la recherche ne repart pas pour autant
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, cherche, sociaux]);

  if (source === "compte") return serveur;
  return { resultats: chercherParPseudo(texte), enCours: false, erreur: null };
}
