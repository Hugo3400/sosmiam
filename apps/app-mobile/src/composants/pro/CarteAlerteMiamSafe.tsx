import { useState } from "react";
import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { LIBELLES_ENDROIT_ALERTE } from "~/contenus/miam-safe";

type Props = {
  /** Après « On arrive » : le comptoir l'annonce */
  onRepondre: (texte: string) => void;
};

/**
 * Une alerte silencieuse Miam Safe au comptoir (démo) : le prénom, où la personne est et son petit détail, jamais son nom ni sa
 * photo. « On arrive » la prévient tout de suite ; sans réponse en 2 minutes, l'alerte remonte à l'équipe SOS Miam.
 * En vrai, elle arrive aussi en notification sur les téléphones pro, app fermée.
 */
export function CarteAlerteMiamSafe({ onRepondre }: Props) {
  const [repondue, setRepondue] = useState(false);
  if (repondue) return null;
  return (
    <View accessibilityRole="alert" className="gap-3 rounded-carte border-2 border-jaune bg-encre p-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-texte-gras text-xs text-jaune">🛡 MIAM SAFE · IL Y A 20 S</Text>
        <Text className="font-texte-gras text-xs text-gris-nuit">Démo</Text>
      </View>
      <Text className="font-titre-gras text-2xl text-creme">Léa a besoin d'aide</Text>
      <Text className="font-texte-semi text-base text-creme">{LIBELLES_ENDROIT_ALERTE.terrasse} · table 12, pull vert</Text>
      <Text className="font-texte text-sm leading-5 text-gris-nuit">Va la voir discrètement. Pas d'annonce en salle.</Text>
      <Bouton
        libelle="On arrive"
        variante="jaune"
        indice="Léa voit tout de suite que quelqu'un arrive"
        onPress={() => {
          setRepondue(true);
          onRepondre("🛡 Léa sait que tu arrives");
        }}
      />
    </View>
  );
}
