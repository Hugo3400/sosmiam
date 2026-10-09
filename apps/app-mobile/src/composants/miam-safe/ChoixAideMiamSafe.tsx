import { Pressable, Text, View } from "react-native";

import { NumerosUrgence } from "~/composants/miam-safe/NumerosUrgence";

/** Les façons d'avoir de l'aide, dans la feuille Miam Safe */
export type VueAideMiamSafe = "pote" | "comptoir" | "alerte" | "raconter";

type Props = {
  /** Le lieu a signé la charte : la phrase, l'écran et l'alerte silencieuse marchent chez lui */
  engage: boolean;
  onChoisir: (vue: VueAideMiamSafe) => void;
};

type Choix = { vue: VueAideMiamSafe; emoji: string; titre: string; detail: string; seulementEngage?: boolean };

const CHOIX: readonly Choix[] = [
  { vue: "pote", emoji: "👋", titre: "Prévenir un pote", detail: "Bientôt. Pour l'instant : appelle un proche." },
  { vue: "comptoir", emoji: "🛎", titre: "Demander au comptoir", detail: "Une phrase à dire, ou un écran à montrer.", seulementEngage: true },
  { vue: "alerte", emoji: "🤫", titre: "Alerter le comptoir en silence", detail: "Si tu ne peux pas y aller.", seulementEngage: true },
  { vue: "raconter", emoji: "✏️", titre: "Raconter ce qui s'est passé", detail: "Reste entre toi et notre équipe." },
];

/** Le premier écran de Miam Safe : les secours d'abord, puis les autres façons d'avoir de l'aide. */
export function ChoixAideMiamSafe({ engage, onChoisir }: Props) {
  const choix = CHOIX.filter((c) => engage || !c.seulementEngage);
  return (
    <View className="gap-4">
      <NumerosUrgence />
      <View className="gap-2">
        {choix.map((c) => (
          <Pressable
            key={c.vue}
            accessibilityRole="button"
            accessibilityLabel={`${c.titre}. ${c.detail}`}
            onPress={() => onChoisir(c.vue)}
            className="min-h-14 flex-row items-center gap-3 rounded-2xl border-2 border-encre bg-white px-4 py-3 active:opacity-80"
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-jaune-clair">
              <Text className="text-lg">{c.emoji}</Text>
            </View>
            <View className="shrink grow gap-0.5">
              <Text className="font-texte-gras text-base text-encre">{c.titre}</Text>
              <Text className="font-texte text-sm text-gris">{c.detail}</Text>
            </View>
          </Pressable>
        ))}
      </View>
      {engage ? (
        <Text className="text-center font-texte text-sm leading-5 text-gris">Le souci vient de l'équipe du lieu ? Appelle plutôt un proche ou les secours.</Text>
      ) : (
        <Text className="text-center font-texte text-sm leading-5 text-gris">Ce lieu n'a pas encore signé la charte Miam Safe : son équipe ne connaît pas la phrase.</Text>
      )}
    </View>
  );
}
