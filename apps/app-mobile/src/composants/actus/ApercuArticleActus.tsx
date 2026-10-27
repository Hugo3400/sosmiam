import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ContenuArticle } from "~/composants/actus/ContenuArticle";
import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/textes-actus";
import type { ArticleActusAffiche } from "~/contenus/type-article-actus";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = { article: ArticleActusAffiche | null; titre: string; fermer: string; onFermer: () => void };

const rien = () => {};

export function ApercuArticleActus({ article, titre, fermer, onFermer }: Props) {
  const couleurs = utiliserCouleurs();
  const marges = useSafeAreaInsets();
  const T = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE);
  return (
    <Modal visible={article !== null} animationType="slide" presentationStyle="fullScreen" onRequestClose={onFermer}>
      <View style={{ flex: 1, backgroundColor: couleurs.creme }}>
        {article ? (
          <ScrollView contentContainerStyle={{ paddingBottom: marges.bottom + 32 }}>
            <View style={{ height: 260 + marges.top }} className="bg-jaune-clair">
              {typeof article.couverture === "object" ? (
                <Image source={article.couverture} accessible={false} contentFit="cover" style={{ width: "100%", height: "100%" }} />
              ) : null}
            </View>
            <View className="gap-6 px-5 pt-5">
              <ContenuArticle article={article} T={T} onVoir={rien} onYAller={rien} />
            </View>
          </ScrollView>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={fermer}
          hitSlop={8}
          onPress={onFermer}
          style={{ top: marges.top + 8 }}
          className="absolute right-4 h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
        >
          <Ionicons name="close" size={22} color={couleurs.encre} />
        </Pressable>
        <View pointerEvents="none" style={{ top: marges.top + 14 }} className="absolute left-4 rounded-full border-2 border-nuit bg-jaune px-3 py-1">
          <Text className="font-texte-gras text-xs text-nuit">{titre}</Text>
        </View>
      </View>
    </Modal>
  );
}
