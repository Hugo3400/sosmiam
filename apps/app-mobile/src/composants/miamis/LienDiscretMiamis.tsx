import { Pressable, Text } from "react-native";

type Props = {
  libelle: string;
  onPress: () => void;
  desactive?: boolean;
  danger?: boolean;
  indice?: string;
};

export function LienDiscretMiamis({ libelle, onPress, desactive = false, danger = false, indice }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={indice}
      accessibilityState={{ disabled: desactive }}
      disabled={desactive}
      onPress={onPress}
      hitSlop={4}
      className={`min-h-11 items-center justify-center px-2 active:opacity-70 ${desactive ? "opacity-40" : ""}`}
    >
      <Text className={`text-center font-texte-semi text-sm underline ${danger ? "text-rouge-texte" : "text-encre"}`}>{libelle}</Text>
    </Pressable>
  );
}
