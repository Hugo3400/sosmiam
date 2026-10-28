import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { Annonce } from "~/composants/interface/Annonce";
import { BarreEtatTheme } from "~/composants/interface/BarreEtatTheme";
import { ListeTuSuis } from "~/composants/suivi/ListeTuSuis";
import { TEXTES_ECRAN_SUIVIS_PAR_LANGUE } from "~/contenus/textes-profil-onglet";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * « Tu suis » (depuis l'onglet Profil) : les personnes, les lieux et les créateurs que tu suis (ListeTuSuis), puis des
 * suggestions. La liste est figée à l'ouverture : une ligne qu'on ne suit plus reste là avec « Suivre », pour se raviser.
 */
export default function Suivis() {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_ECRAN_SUIVIS_PAR_LANGUE);
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const annoncer = useCallback((texte: string) => setAnnonce({ texte, numero: Date.now() }), []);

  const revenir = () => (router.canGoBack() ? router.back() : router.replace("/profil"));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <BarreEtatTheme />
      <View className="min-h-14 flex-row items-center px-5 pb-3 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.retour}
          hitSlop={12}
          onPress={revenir}
          className="h-10 w-10 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="gap-6 px-5 pb-10">
        <View className="gap-1">
          <Text accessibilityRole="header" className="font-titre text-3xl text-encre">
            {T.titre}
          </Text>
          <Text className="font-texte text-base leading-6 text-gris">
            {lierPonctuation(T.intro)}
          </Text>
        </View>

        <ListeTuSuis onAnnoncer={annoncer} />
      </ScrollView>

      <Annonce annonce={annonce} haut={marges.top + 60} onFin={finAnnonce} />
    </SafeAreaView>
  );
}
