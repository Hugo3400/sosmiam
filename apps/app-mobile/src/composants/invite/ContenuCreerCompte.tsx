import type { Ref } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { raisonsCompte } from "~/contenus/raisons-compte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { RaisonCompte } from "~/hooks/utiliser-compte-requis";

type Props = {
  /** Le geste qui demande un compte : il donne l'emoji, le titre et la phrase */
  raison: RaisonCompte;
  /** Le titre, où le lecteur d'écran se place quand la feuille arrive */
  refTitre: Ref<Text>;
  onInscrire: () => void;
  /** « Plus tard » : on continue la visite sans compte */
  onPlusTard: () => void;
};

/** Ce qu'un compte apporte, en trois mots (les mêmes pour tous les gestes) */
const AVANTAGES = [
  { emoji: "🛟", texte: "Sauve des lieux et gagne des points" },
  { emoji: "👯", texte: "Retrouve tes potes et organisez vos sorties" },
  { emoji: "📌", texte: "Garde tes lieux préférés et donne ton avis" },
] as const;

/**
 * L'intérieur de la feuille « Crée ton compte pour … » : emoji, titre, phrase, trois avantages, puis « Je m'inscris (1 min) »
 * et « Plus tard ». Le haut défile avec un très grand texte, les deux boutons restent toujours à l'écran. Sert à la feuille
 * de toute l'app (FeuilleCreerCompte) et à celle posée sur une autre feuille (FeuilleCreerComptePosee).
 */
export function ContenuCreerCompte({ raison, refTitre, onInscrire, onPlusTard }: Props) {
  const { emoji, titre, phrase } = raisonsCompte[raison];

  return (
    <>
      <ScrollView style={{ flexGrow: 0 }} contentContainerClassName="px-5">
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="mb-3 h-16 w-16 items-center justify-center self-center rounded-full border-2 border-encre bg-jaune"
        >
          <Text className="text-3xl">{emoji}</Text>
        </View>
        <Text ref={refTitre} accessibilityRole="header" className="text-center font-titre text-2xl text-encre">
          {lierPonctuation(titre)}
        </Text>
        <Text className="mt-2 text-center font-texte text-base leading-6 text-gris">{lierPonctuation(phrase)}</Text>
        <View className="mt-5 gap-2 rounded-carte border-2 border-encre bg-white p-4">
          {AVANTAGES.map((avantage) => (
            <View key={avantage.texte} accessible accessibilityLabel={avantage.texte} className="flex-row items-center gap-3">
              <Text className="text-xl">{avantage.emoji}</Text>
              <Text className="flex-1 font-texte-semi text-[15px] leading-[22px] text-encre">{avantage.texte}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <View className="mt-5 gap-3 px-5">
        <Bouton libelle="Je m'inscris (1 min)" variante="encre" indice="Ouvre l'inscription : Apple, Google ou ton e-mail" onPress={onInscrire} />
        <Pressable
          accessibilityRole="button"
          accessibilityHint="Tu continues ta visite sans compte"
          onPress={onPlusTard}
          className="min-h-12 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
        >
          <Text className="font-texte-gras text-base text-encre">Plus tard</Text>
        </Pressable>
      </View>
    </>
  );
}
