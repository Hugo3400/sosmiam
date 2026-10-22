import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { ReglagesMessagerie } from "@sos-miam/commun/types/social";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";
import { changerReglagesMessagerieDemo, ecouterReglagesMessagerieDemo, lireReglagesMessagerieDemo } from "~/services/demo/reglages-messagerie-demo";

export type EtatReglagesMessagerie = {
  disponible: boolean;
  pret: boolean;
  reglages: ReglagesMessagerie;
  changer: (changements: Partial<ReglagesMessagerie>) => Promise<ErreurService | null>;
};

const PAR_DEFAUT: ReglagesMessagerie = { accusesLecture: true, apercuMessages: true };

const lireReglages = (brut: Partial<ReglagesMessagerie> | undefined): ReglagesMessagerie => ({
  accusesLecture: brut?.accusesLecture ?? PAR_DEFAUT.accusesLecture,
  apercuMessages: brut?.apercuMessages ?? PAR_DEFAUT.apercuMessages,
});

export function utiliserReglagesMessagerie(): EtatReglagesMessagerie {
  const source = utiliserSourceSociale();
  const { sociaux } = utiliserSession();
  const compte = source === "compte";
  const demo = source === "demo";
  const reglagesDemo = useSyncExternalStore(ecouterReglagesMessagerieDemo, lireReglagesMessagerieDemo, lireReglagesMessagerieDemo);
  const [reglages, setReglages] = useState<ReglagesMessagerie>(PAR_DEFAUT);
  const [pret, setPret] = useState(false);
  const courant = useRef(reglages);
  courant.current = reglages;

  useEffect(() => {
    if (!compte) {
      setReglages(PAR_DEFAUT);
      setPret(false);
      return;
    }
    let actif = true;
    void sociaux.social
      .lireMoi()
      .catch(() => null)
      .then((r) => {
        if (!actif) return;
        if (r?.ok && r.moi) setReglages(lireReglages(r.moi.reglages));
        setPret(true);
      });
    return () => {
      actif = false;
    };
  }, [compte, sociaux]);

  const changer = useCallback(
    async (changements: Partial<ReglagesMessagerie>): Promise<ErreurService | null> => {
      if (demo) {
        changerReglagesMessagerieDemo(changements);
        return null;
      }
      if (!compte) return "session-app-requise";
      const avant = courant.current;
      setReglages({ ...avant, ...changements });
      const r = await sociaux.social.modifierReglages(changements).catch(() => ({ ok: false as const, erreur: "hors-ligne" as ErreurService }));
      if (!r.ok) {
        setReglages((maintenant) => ({ ...maintenant, ...Object.fromEntries(Object.keys(changements).map((cle) => [cle, avant[cle as keyof ReglagesMessagerie]])) }));
        return r.erreur;
      }
      setReglages(lireReglages(r.moi.reglages));
      return null;
    },
    [compte, demo, sociaux],
  );

  return useMemo(
    () => ({ disponible: compte || demo, pret: demo || pret, reglages: demo ? reglagesDemo : reglages, changer }),
    [compte, demo, pret, reglagesDemo, reglages, changer],
  );
}
