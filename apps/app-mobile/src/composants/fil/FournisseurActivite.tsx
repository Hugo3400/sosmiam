import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { RESCOUSSES_PAR_SEMAINE } from "@sos-miam/commun/regles/rescousses";
import { calculerCleSemaine } from "~/fonctions/dates/calculer-cle-semaine";
import { ContexteActivite, type ResultatRescousse } from "~/hooks/utiliser-activite";
import { enregistrerActiviteLocale, lireActiviteLocale, type ActiviteLocale } from "~/stockage/activite-locale";

/** Rescousses de la semaine (remises à 3 chaque lundi), lieux gardés, J'aime et masques, enregistrés sur le téléphone à chaque changement. */
export function FournisseurActivite({ children }: { children: ReactNode }) {
  const [activite, setActivite] = useState<ActiviteLocale>(() => ({ semaine: calculerCleSemaine(), rescousses: [], gardes: [], jaimes: [], masques: [] }));
  const chargee = useRef(false);

  useEffect(() => {
    lireActiviteLocale().then((lue) => {
      chargee.current = true;
      if (!lue) return;
      // Nouvelle semaine : les rescousses reviennent ; les lieux gardés, J'aime et masques restent
      const semaine = calculerCleSemaine();
      setActivite(lue.semaine === semaine ? lue : { ...lue, semaine, rescousses: [] });
    });
  }, []);

  useEffect(() => {
    if (chargee.current) enregistrerActiviteLocale(activite).catch(() => {});
  }, [activite]);

  const restantes = RESCOUSSES_PAR_SEMAINE - activite.rescousses.length;

  const basculerRescousse = useCallback(
    (idLieu: number): ResultatRescousse => {
      if (activite.rescousses.includes(idLieu)) {
        setActivite((a) => ({ ...a, rescousses: a.rescousses.filter((id) => id !== idLieu) }));
        return "annulee";
      }
      if (restantes <= 0) return "epuisee";
      setActivite((a) => ({ ...a, rescousses: [...a.rescousses, idLieu] }));
      return "donnee";
    },
    [activite.rescousses, restantes],
  );

  const basculerGarde = useCallback(
    (idLieu: number) => {
      const garde = !activite.gardes.includes(idLieu);
      setActivite((a) => ({ ...a, gardes: garde ? [...a.gardes, idLieu] : a.gardes.filter((id) => id !== idLieu) }));
      return garde;
    },
    [activite.gardes],
  );

  const basculerJaime = useCallback(
    (idPublication: string) => {
      const aime = !activite.jaimes.includes(idPublication);
      setActivite((a) => ({ ...a, jaimes: aime ? [...a.jaimes, idPublication] : a.jaimes.filter((id) => id !== idPublication) }));
      return aime;
    },
    [activite.jaimes],
  );

  const aimer = useCallback((idPublication: string) => {
    setActivite((a) => (a.jaimes.includes(idPublication) ? a : { ...a, jaimes: [...a.jaimes, idPublication] }));
  }, []);

  const masquer = useCallback((idPublication: string) => {
    setActivite((a) => (a.masques.includes(idPublication) ? a : { ...a, masques: [...a.masques, idPublication] }));
  }, []);

  const valeur = useMemo(
    () => ({
      restantes,
      aSauve: (id: number) => activite.rescousses.includes(id),
      estGarde: (id: number) => activite.gardes.includes(id),
      basculerRescousse,
      basculerGarde,
      aime: (id: string) => activite.jaimes.includes(id),
      basculerJaime,
      aimer,
      estMasquee: (id: string) => activite.masques.includes(id),
      masquer,
    }),
    [restantes, activite, basculerRescousse, basculerGarde, basculerJaime, aimer, masquer],
  );
  return <ContexteActivite.Provider value={valeur}>{children}</ContexteActivite.Provider>;
}
