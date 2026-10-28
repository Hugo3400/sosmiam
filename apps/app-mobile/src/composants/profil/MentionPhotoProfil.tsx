import { Linking, Text, View } from "react-native";

import { TEXTES_MENTION_PHOTO_PROFIL_PAR_LANGUE } from "~/contenus/textes-profil-photo";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  partage: "compte" | "visite";
  photoLocale: boolean;
};

export function MentionPhotoProfil({ partage, photoLocale }: Props) {
  const T = utiliserTextes(TEXTES_MENTION_PHOTO_PROFIL_PAR_LANGUE);
  if (partage !== "compte") {
    return <Text className="mt-6 font-texte text-sm leading-5 text-gris">{lierPonctuation(T.sansCompte)}</Text>;
  }
  return (
    <View className="mt-6 gap-2">
      {photoLocale ? <Text className="font-texte-semi text-sm leading-5 text-encre">{lierPonctuation(T.photoLocale)}</Text> : null}
      <Text className="font-texte text-sm leading-5 text-gris">
        {lierPonctuation(T.visibilite)}
      </Text>
      <Text accessibilityRole="link" onPress={() => void Linking.openURL(T.lienRegles).catch(() => undefined)} className="font-texte-semi text-sm text-encre underline">
        {T.regles}
      </Text>
    </View>
  );
}
