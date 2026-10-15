import { router, type Href } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { FenetreAnnonceApp } from "~/composants/annonces-app/FenetreAnnonceApp";
import { lireLienAnnonceApp } from "~/fonctions/annonces-app/lire-lien-annonce-app";
import { utiliserAnnonceApp } from "~/hooks/utiliser-annonce-app";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { lireEcranOuvert } from "~/services/ecran-ouvert";

const DUREE_FERMETURE = Platform.OS === "ios" ? 700 : 450;

export function AnnonceAppOuverture() {
  const { annonce, ouverte, fermer, marquerMontree } = utiliserAnnonceApp();
  const { profil } = utiliserProfil();
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (minuterie.current) clearTimeout(minuterie.current);
    },
    [],
  );

  const lien = annonce?.bouton ? lireLienAnnonceApp(annonce.bouton.lien, { compte: profil !== null }) : null;
  const bouton =
    annonce?.bouton && lien
      ? {
          libelle: annonce.bouton.libelle,
          ouvrir: () => {
            fermer();
            if (minuterie.current) clearTimeout(minuterie.current);
            minuterie.current = setTimeout(() => {
              if (lien !== lireEcranOuvert()) router.push(lien as Href);
            }, DUREE_FERMETURE);
          },
        }
      : null;

  return <FenetreAnnonceApp annonce={annonce} visible={ouverte} bouton={bouton} onFermer={fermer} onMontree={marquerMontree} />;
}
