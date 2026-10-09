import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ReponseComptoir } from "@sos-miam/commun/client-api/contrat-comptoir";
import type { EtatComptoir } from "@sos-miam/commun/types/comptoir";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { MotifRefusVisite, ReglementVisite } from "@sos-miam/commun/types/visite";
import { utiliserServices } from "~/hooks/utiliser-services";

export type EtatUtiliserComptoir = {
  /** L'état du comptoir, ou null avant la première lecture */
  etat: EtatComptoir | null;
  /** La dernière lecture a échoué (pas le droit, hors ligne…) ; on garde l'état d'avant */
  erreur: ErreurService | null;
  rafraichir: () => Promise<void>;
  /** reglement : comment la table a réglé (vaut pour chaque visite validée avec ce QR) */
  montrerQr: (personnes: number, reglement: ReglementVisite) => Promise<ReponseComptoir>;
  cacherQr: () => Promise<ReponseComptoir>;
  marquerReglee: (visiteId: number, codeSaisi: string | null, reglement: ReglementVisite) => Promise<ReponseComptoir>;
  refuser: (visiteId: number, motif: MotifRefusVisite) => Promise<ReponseComptoir>;
  annulerValidation: (visiteId: number, motif: MotifRefusVisite) => Promise<ReponseComptoir>;
  offrirRecompense: (demandeId: number) => Promise<ReponseComptoir>;
};

// L'écran relit le comptoir de temps en temps, pour les attentes (« depuis 3 min ») et ce qui expire tout seul
const RELECTURE_MS = 10_000;
const PAS_DE_LIEU: ReponseComptoir = { ok: false, erreur: "role-requis" };

/**
 * Le comptoir d'un lieu, suivi en direct pendant que l'écran est affiché : relu à chaque changement (une nouvelle
 * addition, un scan) et toutes les 10 s. Chaque geste rend le nouvel état, qui remplace aussitôt l'ancien.
 */
export function utiliserComptoir(lieuId: number | null): EtatUtiliserComptoir {
  const { comptoir } = utiliserServices();
  const [etat, setEtat] = useState<EtatComptoir | null>(null);
  const [erreur, setErreur] = useState<ErreurService | null>(null);
  const monte = useRef(true);
  useEffect(
    () => () => {
      monte.current = false;
    },
    [],
  );

  const appliquer = useCallback((r: ReponseComptoir) => {
    if (!monte.current) return r;
    if (r.ok) {
      setEtat(r.etat);
      setErreur(null);
    }
    return r;
  }, []);

  const rafraichir = useCallback(async () => {
    if (lieuId === null) return;
    const r = await comptoir.lireComptoir(lieuId);
    if (!monte.current) return;
    if (r.ok) {
      setEtat(r.etat);
      setErreur(null);
    } else setErreur(r.erreur);
  }, [comptoir, lieuId]);

  // Un autre lieu : on repart de zéro
  useEffect(() => {
    setEtat(null);
    setErreur(null);
  }, [lieuId]);

  useFocusEffect(
    useCallback(() => {
      rafraichir();
      const desabonner = comptoir.ecouter(() => {
        rafraichir();
      });
      const minuterie = setInterval(rafraichir, RELECTURE_MS);
      return () => {
        desabonner();
        clearInterval(minuterie);
      };
    }, [comptoir, rafraichir]),
  );

  return {
    etat,
    erreur,
    rafraichir,
    montrerQr: async (personnes, reglement) => (lieuId === null ? PAS_DE_LIEU : appliquer(await comptoir.montrerQr(lieuId, personnes, reglement))),
    cacherQr: async () => (lieuId === null ? PAS_DE_LIEU : appliquer(await comptoir.cacherQr(lieuId))),
    marquerReglee: async (visiteId, codeSaisi, reglement) => appliquer(await comptoir.marquerReglee(visiteId, codeSaisi, reglement)),
    refuser: async (visiteId, motif) => appliquer(await comptoir.refuser(visiteId, motif)),
    annulerValidation: async (visiteId, motif) => appliquer(await comptoir.annulerValidation(visiteId, motif)),
    offrirRecompense: async (demandeId) => appliquer(await comptoir.offrirRecompense(demandeId)),
  };
}
