import { Image } from "expo-image";
import { memo } from "react";
import { Pressable, Text, View } from "react-native";

import { calculerMinutesLecture } from "@sos-miam/commun/fonctions/actus/calculer-minutes-lecture";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ACTUS } from "~/contenus/textes-actus";
import type { ArticleActusAffiche } from "~/contenus/type-article-actus";

type Props = { article: ArticleActusAffiche; T: Traduction<typeof TEXTES_ACTUS>; onOuvrir: (id: number) => void };

export const CarteArticleActus = memo(function CarteArticleActus({ article, T, onOuvrir }: Props) {
  const minutes = calculerMinutesLecture(article.paragraphes);
  const auteur = article.auteur.ambassadeur ? `${article.auteur.prenom} · ${T.ambassadeur}` : article.auteur.prenom;
  const details = `${auteur} · ${T.lieux(article.lieux.length)} · ${T.minutes(minutes)}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${T.rubriques[article.rubrique]}. ${article.titre}. ${details}${article.collaboration ? `. ${T.collaboration}` : ""}`}
      onPress={() => onOuvrir(article.id)}
      className="flex-row gap-3 rounded-[18px] border-2 border-encre bg-carte p-2.5 active:opacity-90"
    >
      <Image source={article.couverture} contentFit="cover" transition={150} style={{ width: 92, height: 92, borderRadius: 12 }} />
      <View className="flex-1 gap-1">
        <Text className="font-texte-gras text-[11px] uppercase tracking-wide text-gris">{T.rubriques[article.rubrique]}</Text>
        <Text numberOfLines={3} className="font-texte-gras text-base leading-5 text-encre">
          {article.titre}
        </Text>
        {article.collaboration ? (
          <Text className="self-start rounded-md border border-gris px-2 py-0.5 font-texte-gras text-[11px] text-gris">{T.collaboration}</Text>
        ) : (
          <Text className="font-texte text-xs text-gris">{details}</Text>
        )}
      </View>
    </Pressable>
  );
});
