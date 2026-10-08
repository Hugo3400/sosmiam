import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useBottomTabBarHeight } from "expo-router/tabs";
import type { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Bouton } from "~/composants/interface/Bouton";
import { raisonsCompte } from "~/contenus/raisons-compte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { RaisonCompte } from "~/hooks/utiliser-compte-requis";
import couleurs from "~/theme/couleurs";

type Props = {
  /** L'onglet réservé aux inscrits (« potes », « profil », « scan »…) */
  raison: RaisonCompte;
  emoji: string;
  titre: string;
  texte: string;
  /** Ce qui attend la personne une fois inscrite, une ligne chacun */
  avantages: string[];
  /** Sous le bouton (ex. les pages légales du Profil) */
  enPlus?: ReactNode;
};

/**
 * Onglet réservé aux inscrits, pendant la visite sans compte : ce qui t'attend, et « Je m'inscris (1 min) ».
 * La barre d'onglets est posée par-dessus l'écran : la fin de la page passe au-dessus.
 */
export function EcranInvite({ raison, emoji, titre, texte, avantages, enPlus }: Props) {
  const router = useRouter();
  const hauteurBarreOnglets = useBottomTabBarHeight();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]}>
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-5 pt-6"
        contentContainerStyle={{ paddingBottom: hauteurBarreOnglets + 24 }}
      >
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="mb-4 h-24 w-24 items-center justify-center self-center rounded-full border-2 border-encre bg-jaune"
        >
          <Text className="text-5xl">{emoji}</Text>
        </View>
        <Text accessibilityRole="header" className="text-center font-titre text-3xl text-encre">
          {lierPonctuation(titre)}
        </Text>
        <Text className="mt-2 text-center font-texte text-base leading-6 text-gris">{lierPonctuation(texte)}</Text>

        <View className="mt-6 gap-3 rounded-carte border-2 border-encre bg-white p-4">
          {avantages.map((avantage) => (
            <View key={avantage} accessible accessibilityLabel={avantage} className="flex-row items-start gap-3">
              <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-full border-2 border-encre bg-jaune">
                <Ionicons name="checkmark" size={14} color={couleurs.encre} />
              </View>
              <Text className="flex-1 font-texte-semi text-[15px] leading-[22px] text-encre">{lierPonctuation(avantage)}</Text>
            </View>
          ))}
        </View>

        <Bouton
          libelle="Je m'inscris (1 min)"
          variante="encre"
          indice={`Ouvre l'inscription pour ${raisonsCompte[raison].action}`}
          onPress={() => router.push("/compte")}
          className="mt-6"
        />
        {enPlus ? <View className="mt-4">{enPlus}</View> : null}

        <Text className="mt-6 text-center font-texte text-sm leading-5 text-gris">
          {lierPonctuation("En attendant, le fil « Pour toi » et Explorer restent grands ouverts : régale tes yeux !")}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
