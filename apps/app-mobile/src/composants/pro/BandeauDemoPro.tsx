import { Text, View } from "react-native";

import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Démo : tu joues l'équipe du lieu ; en vrai, une équipe ne valide jamais ses propres visites. */
export function BandeauDemoPro({ nomLieu }: { nomLieu: string }) {
  const texte = `Démo : tu joues l'équipe de ${nomLieu}. En vrai, l'équipe d'un lieu ne valide pas ses propres visites.`;
  return (
    <View accessible accessibilityLabel={texte} className="flex-row items-center gap-2.5 rounded-2xl border-2 border-dashed border-gris/40 bg-white/70 px-3.5 py-2.5">
      <Text className="text-lg">🧪</Text>
      <Text className="flex-1 font-texte text-[13px] leading-5 text-gris">{lierPonctuation(texte)}</Text>
    </View>
  );
}
