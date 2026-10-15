import { Linking, Text, View } from "react-native";

import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const REGLES = "https://sosmiam.fr/cgu#photo-profil";

type Props = {
  partage: "compte" | "demo" | "visite";
  photoLocale: boolean;
};

export function MentionPhotoProfil({ partage, photoLocale }: Props) {
  if (partage !== "compte") {
    const texte = partage === "demo" ? "🔒 En mode démo, ta photo reste sur ton téléphone : rien ne part." : "🔒 Sans compte, ta photo reste sur ton téléphone.";
    return <Text className="mt-6 font-texte text-sm leading-5 text-gris">{lierPonctuation(texte)}</Text>;
  }
  return (
    <View className="mt-6 gap-2">
      {photoLocale ? <Text className="font-texte-semi text-sm leading-5 text-encre">{lierPonctuation("🔒 Ta photo actuelle n'est visible que sur ce téléphone.")}</Text> : null}
      <Text className="font-texte text-sm leading-5 text-gris">
        {lierPonctuation(
          "📸 Une photo est visible par les autres Miamis partout où ton avatar apparaît (ta bande, tes commentaires, la messagerie), même si ton compte est privé. Tu la changes ou la retires quand tu veux. Une photo de toi ou de ton plat fétiche, pas celle de quelqu'un d'autre, et rien d'explicite.",
        )}
      </Text>
      <Text accessibilityRole="link" onPress={() => void Linking.openURL(REGLES).catch(() => undefined)} className="font-texte-semi text-sm text-encre underline">
        Les règles de la photo de profil
      </Text>
    </View>
  );
}
