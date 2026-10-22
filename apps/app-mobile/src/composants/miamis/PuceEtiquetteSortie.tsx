import { Text, View } from "react-native";

type Props = {
  nom: string;
  libre?: boolean;
  accent?: boolean;
};

export function PuceEtiquetteSortie({ nom, libre = false, accent = false }: Props) {
  const style = accent ? "border-jaune bg-jaune" : libre ? "border-dashed border-gris bg-carte" : "border-ligne bg-creme";
  return (
    <View className={`rounded-full border-[1.5px] px-2.5 py-1 ${style}`}>
      <Text className={`text-xs ${accent ? "font-texte-gras text-nuit" : "font-texte-semi text-encre"}`}>{nom}</Text>
    </View>
  );
}
