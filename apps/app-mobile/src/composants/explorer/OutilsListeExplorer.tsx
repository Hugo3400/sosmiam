import type { Ref } from "react";
import { Pressable, Text, View } from "react-native";

import { AvisPositionApproximative } from "~/composants/explorer/AvisPositionApproximative";
import { BoutonAutourDeMoi } from "~/composants/explorer/BoutonAutourDeMoi";
import { TEXTES_EXPLORER_PAR_LANGUE } from "~/contenus/textes-explorer";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  nombre: number;
  resume: string;
  refCompteur: Ref<Text>;
  autourDeMoiActif: boolean;
  recherche: boolean;
  avisApproximative: boolean;
  onToucherAutourDeMoi: () => void;
  onArreterAutourDeMoi: () => void;
  onFermerAvisApproximative: () => void;
  onRoulette: () => void;
};

export function OutilsListeExplorer(props: Props) {
  const { nombre, resume, refCompteur, autourDeMoiActif, recherche, avisApproximative } = props;
  const T = utiliserTextes(TEXTES_EXPLORER_PAR_LANGUE).outils;
  return (
    <View className="gap-1 px-4 pb-2">
      <View className="flex-row flex-wrap items-center justify-end gap-2">
        <Text ref={refCompteur} accessibilityRole="header" className="grow font-titre text-xl text-encre">
          {T.nombreLieux(nombre)}
        </Text>
        <View className="flex-row items-center gap-2">
          <BoutonAutourDeMoi actif={autourDeMoiActif} recherche={recherche} onToucher={props.onToucherAutourDeMoi} onArreter={props.onArreterAutourDeMoi} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={T.roulette}
            accessibilityHint={T.rouletteIndice}
            onPress={() => {
              vibrerLegerement();
              props.onRoulette();
            }}
            className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-jaune active:opacity-80"
          >
            <Text className="text-xl">🎲</Text>
          </Pressable>
        </View>
      </View>
      {resume ? <Text className="font-texte text-xs text-gris">{resume}</Text> : null}
      {avisApproximative ? (
        <View className="pt-2">
          <AvisPositionApproximative onFermer={props.onFermerAvisApproximative} />
        </View>
      ) : null}
    </View>
  );
}
