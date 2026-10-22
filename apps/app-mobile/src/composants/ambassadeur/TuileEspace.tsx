import { Pressable, Text } from "react-native";

type Props = { emoji: string; nombre: number | null; libelle: string; onPress: () => void };

/** Une tuile de l'Espace : un chiffre (missions à faire, avis à relire, messages non lus) qui ouvre son onglet. */
export function TuileEspace({ emoji, nombre, libelle, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${nombre ?? "…"} ${libelle}`}
      onPress={onPress}
      className={`min-h-28 flex-1 justify-between rounded-carte border-2 border-encre p-3 active:opacity-80 ${nombre ? "bg-jaune" : "bg-carte"}`}
    >
      <Text className="text-2xl">{emoji}</Text>
      <Text className={`font-titre text-3xl ${nombre ? "text-nuit" : "text-encre"}`}>{nombre ?? "…"}</Text>
      <Text className={`font-texte text-[13px] leading-[17px] ${nombre ? "text-nuit" : "text-encre"}`}>{libelle}</Text>
    </Pressable>
  );
}
