import { ActivityIndicator, Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_ENCART_PHOTO_LOCALE_PAR_LANGUE } from "~/contenus/textes-profil-photo";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  enCours: boolean;
  onMontrer: () => void;
  onLaisser: () => void;
};

export function EncartPhotoLocale({ enCours, onMontrer, onLaisser }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_ENCART_PHOTO_LOCALE_PAR_LANGUE);
  return (
    <View className="mt-6 gap-3 rounded-carte border-2 border-encre bg-jaune-clair p-4">
      <Text accessibilityRole="header" className="font-texte-gras text-base text-encre">
        {T.titre}
      </Text>
      <Text className="font-texte text-sm leading-5 text-encre">
        {lierPonctuation(T.texte)}
      </Text>
      {enCours ? (
        <ActivityIndicator color={couleurs.encre} accessibilityLabel={T.preparation} />
      ) : (
        <View className="gap-3">
          <Bouton libelle={T.montrer} variante="encre" petit onPress={onMontrer} indice={T.indiceMontrer} />
          <Bouton libelle={T.laisser} variante="blanc" petit onPress={onLaisser} indice={T.indiceLaisser} />
        </View>
      )}
    </View>
  );
}
