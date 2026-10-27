import { Image } from "expo-image";
import { memo } from "react";
import { Pressable, Text, View } from "react-native";

import { calculerMinutesLecture } from "@sos-miam/commun/fonctions/actus/calculer-minutes-lecture";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import { PastilleAmbassadeur } from "~/composants/actus/PastilleAmbassadeur";
import { EmojiOuMiami } from "~/composants/profil/EmojiOuMiami";
import type { TEXTES_ACTUS } from "~/contenus/textes-actus";
import type { ArticleActusAffiche } from "~/contenus/type-article-actus";

type Props = { article: ArticleActusAffiche; T: Traduction<typeof TEXTES_ACTUS>; onOuvrir: (id: number) => void };

export const CarteArticleUne = memo(function CarteArticleUne({ article, T, onOuvrir }: Props) {
  const minutes = calculerMinutesLecture(article.paragraphes);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${T.aLaUne}, ${T.rubriques[article.rubrique]}. ${article.titre}. ${article.auteur.prenom}, ${T.minutesLecture(minutes)}`}
      onPress={() => onOuvrir(article.id)}
      style={{ shadowColor: "#1A1A1A", shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}
      className="overflow-hidden rounded-[22px] border-2 border-encre bg-carte active:opacity-90"
    >
      <View>
        <Image source={article.couverture} contentFit="cover" transition={150} style={{ width: "100%", height: 176 }} />
        <View className="absolute left-3 top-3 rounded-full border-2 border-nuit bg-jaune px-2.5 py-1">
          <Text maxFontSizeMultiplier={1.3} className="font-texte-gras text-xs text-nuit">
            {`${T.aLaUne} · ${T.rubriques[article.rubrique]}`}
          </Text>
        </View>
      </View>
      <View className="gap-2 px-4 pb-4 pt-3.5">
        <Text className="font-titre text-[22px] leading-[26px] text-encre">{article.titre}</Text>
        <Text className="font-texte text-sm leading-5 text-gris">{article.accroche}</Text>
        <View className="mt-0.5 flex-row flex-wrap items-center gap-2">
          <EmojiOuMiami valeur={article.auteur.avatar} taille={28} className="text-xl" />
          <Text className="font-texte-gras text-[13px] text-encre">{article.auteur.prenom}</Text>
          {article.auteur.ambassadeur ? <PastilleAmbassadeur libelle={T.ambassadeur} /> : null}
          <Text className="ml-auto font-texte text-xs text-gris">{`${T.minutes(minutes)} · ${T.jaime(article.jaime)}`}</Text>
        </View>
      </View>
    </Pressable>
  );
});
