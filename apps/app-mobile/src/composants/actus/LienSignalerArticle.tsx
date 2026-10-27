import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, Text } from "react-native";

import type { ReponseLieuActus } from "@sos-miam/commun/types/actus";
import { FeuilleSignalerArticle } from "~/composants/actus/FeuilleSignalerArticle";
import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/textes-actus";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = { articleId: number; titre: string; nomLieu: string; reponses: readonly ReponseLieuActus[] };

export function LienSignalerArticle({ articleId, titre, nomLieu, reponses }: Props) {
  const T = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE).article.signaler;
  const couleurs = utiliserCouleurs();
  const [ouvert, setOuvert] = useState(false);
  return (
    <>
      <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setOuvert(true)} className="min-h-11 flex-row items-center gap-2 self-start active:opacity-70">
        <Ionicons name="flag-outline" size={16} color={couleurs.gris} />
        <Text className="font-texte-moyen text-sm text-gris underline">{T.lien}</Text>
      </Pressable>
      <FeuilleSignalerArticle visible={ouvert} articleId={articleId} titre={titre} nomLieu={nomLieu} reponses={reponses} onFermer={() => setOuvert(false)} />
    </>
  );
}
