import { useCallback, useEffect, useState } from "react";

import { TEXTES_FOND } from "~/contenus/fond.ts";
import { demanderJetonCompteurs } from "~/services/compteurs.ts";
import { deprotegerSecret, peutResterEnFond, protegerSecret, reglerFond } from "~/services/systeme.ts";
import { estPosteDePassage, type CoffreCle } from "~/stockage/coffre-local.ts";
import { ecrireChoixFond, garderJetonCompteurs, lireChoixFond, lireJetonCompteursGarde, oublierJetonCompteurs } from "~/stockage/jeton-compteurs.ts";

const RENOUVELER_APRES_MS = 30 * 24 * 3600_000;

export function utiliserFond(coffre: CoffreCle | null, connecte: boolean) {
  const [choix, setChoix] = useState(lireChoixFond);
  const [jeton, setJeton] = useState<string | null>(null);
  const [erreur, setErreur] = useState(false);
  const possible = peutResterEnFond() && coffre !== null && !estPosteDePassage(coffre);
  const actif = possible && choix;

  useEffect(() => {
    void reglerFond(actif, TEXTES_FOND.barre).catch(() => {});
  }, [actif]);

  useEffect(() => {
    if (!actif) {
      setJeton(null);
      return;
    }
    const garde = lireJetonCompteursGarde();
    if (!garde) return;
    let annule = false;
    deprotegerSecret(garde.protege).then(
      (octets) => !annule && setJeton(new TextDecoder().decode(octets)),
      () => oublierJetonCompteurs(),
    );
    return () => {
      annule = true;
    };
  }, [actif]);

  useEffect(() => {
    if (!actif || !connecte) return;
    const garde = lireJetonCompteursGarde();
    if (garde && Date.now() - garde.creeLe < RENOUVELER_APRES_MS) return;
    let annule = false;
    void (async () => {
      try {
        const { jeton: nouveau } = await demanderJetonCompteurs();
        garderJetonCompteurs({ protege: await protegerSecret(new TextEncoder().encode(nouveau)), creeLe: Date.now() });
        if (annule) return;
        setJeton(nouveau);
        setErreur(false);
      } catch {
        if (!annule) setErreur(true);
      }
    })();
    return () => {
      annule = true;
    };
  }, [actif, connecte]);

  const changer = useCallback((oui: boolean) => {
    ecrireChoixFond(oui);
    setChoix(oui);
    if (!oui) oublierJetonCompteurs();
  }, []);

  const oublier = useCallback(() => {
    oublierJetonCompteurs();
    setJeton(null);
    void reglerFond(false, TEXTES_FOND.barre).catch(() => {});
  }, []);

  const jetonRefuse = useCallback(() => {
    oublierJetonCompteurs();
    setJeton(null);
  }, []);

  return { possible, actif, jeton, erreur, changer, oublier, jetonRefuse };
}
