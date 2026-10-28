import { Pressable, Text, View } from "react-native";

import { TEXTES_EN_TETE_MODE_PAR_LANGUE } from "~/contenus/textes-modes";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  mode: "pro" | "ambassadeur";
  titre: string;
  sousTitre?: string;
};

/**
 * En haut de chaque onglet d'un mode : la pastille du mode (qu'on ne le confonde jamais avec son SOS Miam perso),
 * le titre, et « Revenir à mon SOS Miam » toujours à portée de pouce.
 */
export function EnTeteMode({ mode, titre, sousTitre }: Props) {
  const T = utiliserTextes(TEXTES_EN_TETE_MODE_PAR_LANGUE);
  const { revenirAuModePerso } = utiliserModes();
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between gap-3">
        <View className="rounded-full border-2 border-encre bg-nuit px-2.5 py-0.5">
          <Text className="font-texte-gras text-xs uppercase tracking-wider text-jaune">{T.pastilles[mode]}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.revenir}
          accessibilityHint={T.indiceRevenir(T.pastilles[mode])}
          hitSlop={8}
          onPress={() => {
            vibrerLegerement();
            revenirAuModePerso();
          }}
          className="min-h-11 justify-center active:opacity-60"
        >
          <Text className="font-texte-gras text-sm text-encre underline">{T.revenir}</Text>
        </Pressable>
      </View>
      <Text accessibilityRole="header" className="font-titre text-3xl text-encre">
        {lierPonctuation(titre)}
      </Text>
      {sousTitre ? <Text className="font-texte text-base leading-6 text-gris">{lierPonctuation(sousTitre)}</Text> : null}
    </View>
  );
}
