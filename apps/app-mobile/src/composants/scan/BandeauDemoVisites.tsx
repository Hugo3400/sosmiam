import { Text, View } from "react-native";

import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Rappel honnête en démo : les visites restent sur ce téléphone et ne compteront pas quand les comptes arriveront. */
export function BandeauDemoVisites() {
  return (
    <View
      accessible
      accessibilityLabel="Démo : tes visites restent sur ce téléphone et ne compteront pas quand les comptes arriveront."
      className="flex-row items-center gap-2.5 rounded-2xl border-2 border-dashed border-gris/40 bg-white/70 px-3.5 py-2.5"
    >
      <Text className="text-lg">🧪</Text>
      <Text className="flex-1 font-texte text-[13px] leading-5 text-gris">
        <Text className="font-texte-gras text-encre">Démo</Text>
        {lierPonctuation(" : tes visites restent sur ce téléphone et ne compteront pas quand les comptes arriveront.")}
      </Text>
    </View>
  );
}
