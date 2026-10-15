import { Image } from "expo-image";
import { useState } from "react";
import { Text, View, type TextProps } from "react-native";

import { EMOJI_AVATAR_PAR_DEFAUT } from "@sos-miam/commun/regles/avatar-par-defaut";

type Props = {
  adresse: string;
  taille: number;
  texte: Pick<TextProps, "className" | "style" | "allowFontScaling">;
};

export function PhotoProfilPersonne({ adresse, taille, texte }: Props) {
  const [etat, setEtat] = useState<"chargement" | "prete" | "cassee">("chargement");
  return (
    <View style={{ width: taille, height: taille, borderRadius: taille / 2, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {etat === "prete" ? null : <Text {...texte}>{EMOJI_AVATAR_PAR_DEFAUT}</Text>}
      {etat === "cassee" ? null : (
        <Image
          source={{ uri: adresse }}
          accessible={false}
          contentFit="cover"
          onLoad={() => setEtat("prete")}
          onError={() => setEtat("cassee")}
          style={{ position: "absolute", top: 0, left: 0, width: taille, height: taille, borderRadius: taille / 2 }}
        />
      )}
    </View>
  );
}
