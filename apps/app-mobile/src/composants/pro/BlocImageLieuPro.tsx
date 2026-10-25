import { Image } from "expo-image";
import { Text, View, type ImageSourcePropType } from "react-native";

import type { ImageLieu } from "@sos-miam/commun/regles/images-lieu";
import { Bouton } from "~/composants/interface/Bouton";
import { LogoLieu } from "~/composants/lieux/LogoLieu";
import type { TEXTES_IMAGES_LIEU } from "~/contenus/textes-images-lieu";
import type { EtapeImageLieu } from "~/hooks/utiliser-images-lieu-pro";
import type { Traduction } from "@sos-miam/commun/types/traduction";

type Props = {
  quelle: ImageLieu;
  source: ImageSourcePropType | null;
  etape: EtapeImageLieu | null;
  bloque: boolean;
  T: Traduction<typeof TEXTES_IMAGES_LIEU>;
  onChoisir: () => void;
  onRetirer: () => void;
};

export function BlocImageLieuPro({ quelle, source, etape, bloque, T, onChoisir, onRetirer }: Props) {
  const t = T[quelle];
  const libelle = etape === "preparation" ? T.preparation : etape === "envoi" ? T.envoi : source ? t.changer : t.choisir;
  return (
    <View className="gap-3 rounded-carte border-2 border-encre bg-carte p-4">
      <View className="gap-1">
        <Text accessibilityRole="header" className="font-titre-gras text-lg text-encre">{t.titre}</Text>
        <Text className="font-texte text-sm leading-5 text-gris">{t.detail}</Text>
      </View>
      {quelle === "banniere" ? (
        source ? (
          <View accessible accessibilityRole="image" accessibilityLabel={t.apercu} style={{ aspectRatio: 16 / 5 }} className="w-full overflow-hidden rounded-2xl border-2 border-encre bg-nuit">
            <Image source={source} contentFit="cover" transition={150} style={{ width: "100%", height: "100%" }} />
          </View>
        ) : (
          <View style={{ aspectRatio: 16 / 5 }} className="w-full items-center justify-center rounded-2xl border-2 border-dashed border-encre px-4">
            <Text className="text-center font-texte text-sm text-gris">{t.vide}</Text>
          </View>
        )
      ) : source ? (
        <View accessible accessibilityRole="image" accessibilityLabel={t.apercu} className="self-start">
          <LogoLieu source={source} taille={96} />
        </View>
      ) : (
        <View className="h-24 w-24 items-center justify-center rounded-3xl border-2 border-dashed border-encre p-2">
          <Text className="text-center font-texte text-xs text-gris">{t.vide}</Text>
        </View>
      )}
      <View className="flex-row flex-wrap gap-3">
        <Bouton libelle={libelle} petit desactive={bloque} onPress={onChoisir} />
        {source ? <Bouton libelle={t.retirer} variante="blanc" petit desactive={bloque} onPress={onRetirer} /> : null}
      </View>
    </View>
  );
}
