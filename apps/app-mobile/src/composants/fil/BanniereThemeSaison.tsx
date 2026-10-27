import { Image } from "expo-image";
import { memo } from "react";
import { Pressable, Text, View } from "react-native";

import type { ThemeSaisonApi } from "@sos-miam/commun/types/theme-saison";
import { IMAGES_TENUES_CAPITAINE } from "~/contenus/images-tenues-capitaine";
import { utiliserTheme } from "~/hooks/utiliser-theme";

type Props = { theme: ThemeSaisonApi; onAppuyer: () => void };

export const BanniereThemeSaison = memo(function BanniereThemeSaison({ theme, onAppuyer }: Props) {
  const { schema } = utiliserTheme();
  const c = schema === "sombre" ? theme.couleursSombres : theme.couleurs;
  const t = theme.textes;
  return (
    <View style={{ backgroundColor: c.fond, borderRadius: 24 }} className="flex-row items-center gap-1.5 border-2 border-encre py-4 pl-[18px] pr-3">
      <View className="flex-1 gap-2">
        <Text style={{ color: c.texte }} className="font-texte-gras text-xs uppercase tracking-wider opacity-90">
          {t.etiquette}
        </Text>
        <Text accessibilityRole="header" style={{ color: c.texte }} className="font-titre text-[22px] leading-[26px]">
          {t.titre}
        </Text>
        <Text style={{ color: c.texte }} className="font-texte text-[13px] leading-[18px]">
          {t.texte}
        </Text>
        <Pressable
          accessibilityRole={theme.lienInfo ? "link" : "button"}
          onPress={onAppuyer}
          hitSlop={4}
          style={{ backgroundColor: c.accent }}
          className="mt-1 min-h-11 justify-center self-start rounded-full px-4 active:opacity-80"
        >
          <Text style={{ color: c.surAccent }} className="font-texte-gras text-[13px]">
            {t.bouton}
          </Text>
        </Pressable>
      </View>
      <Image source={IMAGES_TENUES_CAPITAINE[theme.tenue]} accessible accessibilityRole="image" accessibilityLabel={t.tenue} contentFit="contain" style={{ width: 104, height: 114 }} />
    </View>
  );
});
