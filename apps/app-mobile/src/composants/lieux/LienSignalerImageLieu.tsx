import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, Text } from "react-native";

import { estLieuVerifie } from "@sos-miam/commun/fonctions/lieux/est-lieu-verifie";
import { IMAGES_LIEU } from "@sos-miam/commun/regles/images-lieu";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { FeuilleSignalerImageLieu } from "~/composants/lieux/FeuilleSignalerImageLieu";
import { TEXTES_IMAGES_LIEU_PAR_LANGUE } from "~/contenus/textes-images-lieu";
import { lireSourceImageLieu } from "~/fonctions/lieux/lire-source-image-lieu";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function LienSignalerImageLieu({ lieu }: { lieu: Lieu }) {
  const T = utiliserTextes(TEXTES_IMAGES_LIEU_PAR_LANGUE).signaler;
  const couleurs = utiliserCouleurs();
  const [ouvert, setOuvert] = useState(false);
  const quelles = estLieuVerifie(lieu) ? IMAGES_LIEU.filter((q) => lireSourceImageLieu(lieu, q) !== null) : [];
  if (quelles.length === 0) return null;
  return (
    <>
      <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setOuvert(true)} className="min-h-11 flex-row items-center gap-2 self-start active:opacity-70">
        <Ionicons name="flag-outline" size={16} color={couleurs.gris} />
        <Text className="font-texte-moyen text-sm text-gris underline">{T.lien}</Text>
      </Pressable>
      <FeuilleSignalerImageLieu visible={ouvert} lieu={lieu} quelles={quelles} onFermer={() => setOuvert(false)} />
    </>
  );
}
