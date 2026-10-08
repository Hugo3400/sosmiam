import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";

/** Fil « SOS ce soir » sans aucun lieu en SOS ni en alerte. */
export function FilVide({ hauteur, onVoirTout }: { hauteur: number; onVoirTout: () => void }) {
  return (
    <View style={{ height: hauteur }} className="items-center justify-center gap-4 bg-jaune px-8">
      <Mascotte expression="surprise" taille={140} />
      <Text accessibilityRole="header" className="text-center font-titre text-3xl text-encre">Calme plat ce soir</Text>
      <Text className="text-center font-texte text-base leading-6 text-encre/75">
        Aucun lieu n'a lancé de SOS pour l'instant. Garde ton appétit au chaud : on te prévient dès qu'une table se libère près de chez toi.
      </Text>
      <Bouton libelle="Voir toutes les adresses" variante="blanc" onPress={onVoirTout} className="mt-2 self-stretch" />
    </View>
  );
}
