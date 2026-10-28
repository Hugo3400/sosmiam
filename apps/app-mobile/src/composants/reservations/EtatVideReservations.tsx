import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { CARTE_RESERVATION_PAR_LANGUE } from "~/contenus/textes-reservations-client";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  onExplorer: () => void;
};

export function EtatVideReservations({ onExplorer }: Props) {
  const T = utiliserTextes(CARTE_RESERVATION_PAR_LANGUE);
  return (
    <View className="items-center gap-3 rounded-carte border-2 border-dashed border-gris/40 px-6 py-8">
      <Mascotte expression="clin" taille={112} flotte />
      <Text accessibilityRole="header" className="text-center font-titre-gras text-xl text-encre">
        {lierPonctuation(T.videTitre)}
      </Text>
      <Text className="text-center font-texte text-base leading-6 text-gris">
        {lierPonctuation(T.videTexte)}
      </Text>
      <Bouton libelle={T.videBouton} petit className="mt-2" indice={T.videIndice} onPress={onExplorer} />
    </View>
  );
}
