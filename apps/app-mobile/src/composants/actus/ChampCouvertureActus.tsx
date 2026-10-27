import { Image } from "expo-image";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ECRIRE_ACTUS } from "~/contenus/textes-ecrire-actus";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserSourceImageActus } from "~/hooks/utiliser-source-image-actus";

type Props = {
  uri: string | null;
  preparation: boolean;
  erreur: string | null;
  T: Traduction<typeof TEXTES_ECRIRE_ACTUS>["formulaire"];
  onChoisir: () => void;
};

export function ChampCouvertureActus({ uri, preparation, erreur, T, onChoisir }: Props) {
  const couleurs = utiliserCouleurs();
  const source = utiliserSourceImageActus(uri);
  return (
    <View className="gap-2">
      <Text className="font-texte-semi text-base text-encre">{T.couverture}</Text>
      <View className={`h-48 overflow-hidden rounded-[18px] border-2 bg-jaune-clair ${erreur ? "border-rouge-texte" : "border-encre"}`}>
        {source ? <Image source={source} accessible accessibilityLabel={T.couvertureLue} contentFit="cover" style={{ width: "100%", height: "100%" }} /> : null}
        <View className="absolute inset-0 items-center justify-center">
          {preparation ? (
            <ActivityIndicator color={couleurs.encre} accessibilityLabel={T.preparation} />
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={onChoisir}
              className="min-h-11 justify-center rounded-full border-2 border-nuit bg-jaune px-4 active:opacity-80"
            >
              <Text className="font-texte-gras text-sm text-nuit">{uri ? T.couvertureChanger : T.couvertureChoisir}</Text>
            </Pressable>
          )}
        </View>
      </View>
      <Text className={`font-texte text-sm leading-5 ${erreur ? "text-rouge-texte" : "text-gris"}`}>{erreur ?? T.couvertureAide}</Text>
    </View>
  );
}
