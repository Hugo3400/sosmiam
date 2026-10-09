import { Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserModes } from "~/hooks/utiliser-modes";

type Props = {
  mode: "pro" | "ambassadeur";
  titre: string;
  sousTitre?: string;
};

const PASTILLES = { pro: "Mode pro", ambassadeur: "Mode ambassadeur" } as const;

/**
 * En haut de chaque onglet d'un mode : la pastille du mode (qu'on ne le confonde jamais avec son SOS Miam perso),
 * le titre, et « Revenir à mon SOS Miam » toujours à portée de pouce.
 */
export function EnTeteMode({ mode, titre, sousTitre }: Props) {
  const { revenirAuModePerso } = utiliserModes();
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between gap-3">
        <View className="rounded-full bg-encre px-3 py-1">
          <Text className="font-texte-gras text-xs uppercase tracking-wider text-jaune">{PASTILLES[mode]}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Revenir à mon SOS Miam"
          accessibilityHint={`Quitte le ${PASTILLES[mode].toLowerCase()} et revient à ton profil`}
          hitSlop={8}
          onPress={() => {
            vibrerLegerement();
            revenirAuModePerso();
          }}
          className="min-h-11 justify-center active:opacity-60"
        >
          <Text className="font-texte-gras text-sm text-encre underline">Revenir à mon SOS Miam</Text>
        </Pressable>
      </View>
      <Text accessibilityRole="header" className="font-titre text-3xl text-encre">
        {lierPonctuation(titre)}
      </Text>
      {sousTitre ? <Text className="font-texte text-base leading-6 text-gris">{lierPonctuation(sousTitre)}</Text> : null}
    </View>
  );
}
