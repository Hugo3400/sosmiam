import { Text, View } from "react-native";

import { DUREE_PARTAGE_POSITION_MINUTES } from "@sos-miam/commun/regles/miam-safe";
import { NumerosUrgence } from "~/composants/miam-safe/NumerosUrgence";

type Props = { nomLieu: string };

/**
 * « Prévenir un pote » : le partage de ta position avec un pote de ta bande (en direct pendant 1 h, par notre serveur)
 * arrivera avec les vrais potes. D'ici là, on ne fait JAMAIS croire qu'un pote est prévenu : on dit honnêtement que ce n'est
 * pas encore là, et on propose ce qui marche tout de suite (appeler un proche, les secours). Décidé le 9 octobre 2026 : pas
 * de partage par SMS en attendant.
 */
export function PrevenirPoteMiamSafe({ nomLieu }: Props) {
  return (
    <View className="gap-4">
      <View accessible className="gap-2 rounded-2xl border-2 border-dashed border-encre bg-white p-4">
        <Text className="font-texte-gras text-base text-encre">Pas encore disponible</Text>
        <Text className="font-texte text-base leading-6 text-encre">
          Bientôt, ton pote verra où tu es pendant {DUREE_PARTAGE_POSITION_MINUTES / 60} h. Pour l'instant, rien ne part : appelle
          plutôt un proche et dis-lui que tu es au {nomLieu}.
        </Text>
      </View>
      <NumerosUrgence />
    </View>
  );
}
