import { ActivityIndicator, Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  enCours: boolean;
  onMontrer: () => void;
  onLaisser: () => void;
};

export function EncartPhotoLocale({ enCours, onMontrer, onLaisser }: Props) {
  const couleurs = utiliserCouleurs();
  return (
    <View className="mt-6 gap-3 rounded-carte border-2 border-encre bg-jaune-clair p-4">
      <Text accessibilityRole="header" className="font-texte-gras text-base text-encre">
        📸 Ta photo est restée sur ce téléphone
      </Text>
      <Text className="font-texte text-sm leading-5 text-encre">
        {lierPonctuation("Ta photo n'est visible que sur ce téléphone. La montrer à ta bande et aux Miamis ? Elle apparaîtra partout où ton avatar apparaît, et tu la retires quand tu veux.")}
      </Text>
      {enCours ? (
        <ActivityIndicator color={couleurs.encre} accessibilityLabel="Ta photo se prépare" />
      ) : (
        <View className="gap-3">
          <Bouton libelle="La montrer" variante="encre" petit onPress={onMontrer} indice="Ta photo part sur SOS Miam, visible par les autres" />
          <Bouton libelle="Laisser comme ça" variante="blanc" petit onPress={onLaisser} indice="Ta photo reste sur ce téléphone" />
        </View>
      )}
    </View>
  );
}
