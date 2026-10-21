import { useCallback, useEffect, useRef, useState } from "react";
import { Linking } from "react-native";

import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { TEXTES_MISE_A_JOUR } from "~/contenus/textes-mise-a-jour";
import { choisirLienStore } from "~/fonctions/version/choisir-lien-store";
import { annoncerLecteurEcran } from "~/fonctions/interaction/annoncer-lecteur-ecran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { PLATEFORME_STORE } from "~/services/version-installee";

const NOM_STORE = PLATEFORME_STORE ? TEXTES_MISE_A_JOUR.stores[PLATEFORME_STORE] : TEXTES_MISE_A_JOUR.stores.autre;

export type OuvertureStore = { ouvrir: () => Promise<boolean>; erreur: string | null; oublierErreur: () => void; indice: string };

export function utiliserOuvertureStore(): OuvertureStore {
  const [erreur, setErreur] = useState<string | null>(null);
  const monte = useRef(true);

  useEffect(() => {
    monte.current = true;
    return () => {
      monte.current = false;
    };
  }, []);

  const ouvrir = useCallback(async () => {
    const lien = choisirLienStore(PLATEFORME_STORE);
    let ouvert = false;
    if (lien) {
      try {
        await Linking.openURL(lien);
        ouvert = true;
      } catch {
        ouvert = false;
      }
    }
    if (!monte.current) return ouvert;
    if (ouvert) {
      setErreur(null);
      return true;
    }
    const texte = lierPonctuation(remplirModele(TEXTES_MISE_A_JOUR.storeRate, { store: NOM_STORE }));
    setErreur(texte);
    annoncerLecteurEcran(texte);
    return false;
  }, []);

  const oublierErreur = useCallback(() => setErreur(null), []);

  return { ouvrir, erreur, oublierErreur, indice: remplirModele(TEXTES_MISE_A_JOUR.indiceStore, { store: NOM_STORE }) };
}
