import { ActivityIndicator, Text, View } from "react-native";

import type { DescriptionEtatPhoto } from "~/fonctions/compte/decrire-etat-photo";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

export function EtatEnvoiPhoto({ description }: { description: DescriptionEtatPhoto }) {
  return (
    <View
      accessible
      accessibilityLiveRegion="polite"
      className={`mt-4 flex-row items-center gap-3 rounded-carte border-2 p-3 ${description.refus ? "border-rouge-texte bg-white" : "border-encre bg-white"}`}
    >
      {description.enCours ? <ActivityIndicator color={couleurs.encre} /> : null}
      <Text className={`flex-1 font-texte-semi text-sm leading-5 ${description.refus ? "text-rouge-texte" : "text-encre"}`}>{lierPonctuation(description.texte)}</Text>
    </View>
  );
}
