import { Pressable, Text, View } from "react-native";

import { NumerosUrgence } from "~/composants/miam-safe/NumerosUrgence";

export type VueAideMiamSafe = "pote" | "comptoir" | "alerte" | "raconter";

export type CharteLueMiamSafe = "signee" | "pas-signee" | "en-cours" | "inconnue";

type Props = {
  charte: CharteLueMiamSafe;
  onChoisir: (vue: VueAideMiamSafe) => void;
};

type Choix = { vue: VueAideMiamSafe; emoji: string; titre: string; detail: string };

const SOUCI_EQUIPE = "Le souci vient de l'équipe du lieu ? Appelle plutôt un proche ou les secours.";

const TEXTES_CHARTE: Record<Exclude<CharteLueMiamSafe, "signee">, string> = {
  "pas-signee":
    "Ce lieu n'a pas signé la charte Miam Safe : son équipe ne connaît peut-être pas Miam Safe, et l'alerte silencieuse n'y marche pas. L'écran lui dit quoi faire, en clair.",
  "en-cours": "On vérifie si ce lieu a signé la charte Miam Safe…",
  inconnue: "On n'a pas pu vérifier si ce lieu a signé la charte Miam Safe.",
};

function listerChoix(signee: boolean): Choix[] {
  return [
    { vue: "pote", emoji: "👋", titre: "Prévenir un pote", detail: "Une notification, et ta position pendant 1 h." },
    { vue: "comptoir", emoji: "🛎", titre: "Demander au comptoir", detail: signee ? "Une phrase à dire, ou un écran à montrer." : "Un écran à montrer à l'équipe." },
    ...(signee ? [{ vue: "alerte" as const, emoji: "🤫", titre: "Alerter le comptoir en silence", detail: "Si tu ne peux pas y aller." }] : []),
    { vue: "raconter", emoji: "✏️", titre: "Raconter ce qui s'est passé", detail: "Reste entre toi et notre équipe." },
  ];
}

export function ChoixAideMiamSafe({ charte, onChoisir }: Props) {
  const signee = charte === "signee";
  return (
    <View className="gap-4">
      <NumerosUrgence />
      <View className="gap-2">
        {listerChoix(signee).map((c) => (
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
      {signee ? null : (
        <Text accessibilityLiveRegion="polite" className="text-center font-texte text-sm leading-5 text-gris">
          {TEXTES_CHARTE[charte]}
        </Text>
      )}
      <Text className="text-center font-texte text-sm leading-5 text-gris">{SOUCI_EQUIPE}</Text>
    </View>
  );
}
