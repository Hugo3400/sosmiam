import { useCallback, useEffect, useRef, useState } from "react";

import type { RubriqueActus } from "@sos-miam/commun/regles/actus";
import type { BrouillonActusSaisi } from "~/contenus/type-brouillon-actus";
import { creerBrouillonActus } from "~/fonctions/actus/creer-brouillon-actus";
import { effacerBrouillonActus, garderBrouillonActus, lireBrouillonActusGarde } from "~/stockage/brouillon-actus";

const DELAI_GARDE = 400;

export function utiliserBrouillonActus(rubrique: RubriqueActus) {
  const [brouillon, setBrouillon] = useState<BrouillonActusSaisi>(() => creerBrouillonActus(rubrique));
  const [pret, setPret] = useState(false);
  const fini = useRef(false);
  const modifie = useRef(false);

  useEffect(() => {
    let actif = true;
    void lireBrouillonActusGarde().then((garde) => {
      if (!actif) return;
      if (garde?.rubrique === rubrique && !modifie.current) setBrouillon(garde);
      setPret(true);
    });
    return () => {
      actif = false;
    };
  }, [rubrique]);

  useEffect(() => {
    if (!pret || fini.current || !modifie.current) return;
    const minuterie = setTimeout(() => {
      if (!fini.current) void garderBrouillonActus(brouillon);
    }, DELAI_GARDE);
    return () => clearTimeout(minuterie);
  }, [brouillon, pret]);

  const changer = useCallback(<K extends keyof BrouillonActusSaisi>(cle: K, valeur: BrouillonActusSaisi[K]) => {
    modifie.current = true;
    setBrouillon((avant) => ({ ...avant, [cle]: valeur }));
  }, []);

  const terminer = useCallback(async () => {
    fini.current = true;
    await effacerBrouillonActus();
  }, []);

  return { brouillon, pret, changer, terminer };
}
