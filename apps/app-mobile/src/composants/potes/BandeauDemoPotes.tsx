import { Text, View } from "react-native";

/** Le petit bandeau honnête de la démo : la bande d'exemple vote et répond toute seule (affiché seulement en démo). */
export function BandeauDemoPotes() {
  return (
    <View
      accessible
      accessibilityLabel="Démo : ce sont des potes d'exemple, ils votent et répondent tout seuls. Quitte la démo pour retrouver ta vraie bande."
      className="flex-row items-center gap-2.5 rounded-2xl border-2 border-dashed border-gris/40 bg-white/70 px-3.5 py-2.5"
    >
      <Text className="text-lg">🧪</Text>
      <Text className="flex-1 font-texte text-[13px] leading-5 text-gris">
        <Text className="font-texte-gras text-encre">Potes d'exemple</Text>
        {" : ils votent et répondent tout seuls. Quitte la démo pour retrouver ta vraie bande."}
      </Text>
    </View>
  );
}
