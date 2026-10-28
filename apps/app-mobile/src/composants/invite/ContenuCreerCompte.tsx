import type { Ref } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { PoigneeFeuille } from "~/composants/interface/PoigneeFeuille";
import { RAISONS_COMPTE_PAR_LANGUE } from "~/contenus/raisons-compte";
import { TEXTES_INVITE_PAR_LANGUE } from "~/contenus/textes-invite";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { RaisonCompte } from "~/hooks/utiliser-compte-requis";
import type { GlisserPourFermer } from "~/hooks/utiliser-glisser-pour-fermer";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { utiliserTitreDansPoignee } from "~/hooks/utiliser-titre-dans-poignee";

type Props = {
  /** Le geste qui demande un compte : il donne l'emoji, le titre et la phrase */
  raison: RaisonCompte;
  /** Le titre, où le lecteur d'écran se place quand la feuille arrive */
  refTitre: Ref<Text>;
  geste: GlisserPourFermer;
  onInscrire: () => void;
  /** « Plus tard » : on continue la visite sans compte */
  onPlusTard: () => void;
};

/** Ce qu'un compte apporte, en trois mots (les mêmes pour tous les gestes) */
const EMOJIS_AVANTAGES = ["🛟", "👯", "📌"] as const;

/**
 * L'intérieur de la feuille « Crée ton compte pour … » : emoji, titre, phrase, trois avantages, puis « Je m'inscris (1 min) »
 * et « Plus tard ». Le haut défile avec un très grand texte, les deux boutons restent toujours à l'écran. Sert à la feuille
 * de toute l'app (FeuilleCreerCompte) et à celle posée sur une autre feuille (FeuilleCreerComptePosee).
 */
export function ContenuCreerCompte({ raison, refTitre, geste, onInscrire, onPlusTard }: Props) {
  const T = utiliserTextes(TEXTES_INVITE_PAR_LANGUE);
  const { emoji, titre, phrase } = utiliserTextes(RAISONS_COMPTE_PAR_LANGUE)[raison];
  const titreDansPoignee = utiliserTitreDansPoignee();
  const enTete = (
    <>
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
    </>
  );

  return (
    <>
      <PoigneeFeuille geste={geste} ecart="grand" className="px-5">
        {titreDansPoignee ? enTete : null}
      </PoigneeFeuille>
      <ScrollView style={{ flexGrow: 0 }} contentContainerClassName="px-5">
        {titreDansPoignee ? null : enTete}
        <Text className="mt-2 text-center font-texte text-base leading-6 text-gris">{lierPonctuation(phrase)}</Text>
        <View className="mt-5 gap-2 rounded-carte border-2 border-encre bg-carte p-4">
          {T.avantages.map((avantage, i) => (
            <View key={avantage} accessible accessibilityLabel={avantage} className="flex-row items-center gap-3">
              <Text className="text-xl">{EMOJIS_AVANTAGES[i]}</Text>
              <Text className="flex-1 font-texte-semi text-[15px] leading-[22px] text-encre">{avantage}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <View className="mt-5 gap-3 px-5">
        <Bouton libelle={T.jeMInscris} variante="encre" indice={T.indiceInscrire} onPress={onInscrire} />
        <Pressable
          accessibilityRole="button"
          accessibilityHint={T.indicePlusTard}
          onPress={onPlusTard}
          className="min-h-12 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
        >
          <Text className="font-texte-gras text-base text-encre">{T.plusTard}</Text>
        </Pressable>
      </View>
    </>
  );
}
