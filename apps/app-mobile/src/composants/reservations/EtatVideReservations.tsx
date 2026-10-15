import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  onExplorer: () => void;
};

export function EtatVideReservations({ onExplorer }: Props) {
  return (
    <View className="items-center gap-3 rounded-carte border-2 border-dashed border-gris/40 px-6 py-8">
      <Mascotte expression="clin" taille={112} flotte />
      <Text accessibilityRole="header" className="text-center font-titre-gras text-xl text-encre">
        {lierPonctuation("Pas encore de table en vue")}
      </Text>
      <Text className="text-center font-texte text-base leading-6 text-gris">
        {lierPonctuation(
          "Ton agenda gourmand est plus vide qu'un frigo un dimanche soir. Repère une pépite qui prend les réservations dans l'app : ta demande et sa réponse t'attendront ici.",
        )}
      </Text>
      <Bouton libelle="Trouver une pépite" petit className="mt-2" indice="Ouvre l'onglet Explorer" onPress={onExplorer} />
    </View>
  );
}
