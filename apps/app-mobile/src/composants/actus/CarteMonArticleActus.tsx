import { Image } from "expo-image";
import { Pressable, Text, View, type ImageSourcePropType } from "react-native";

import { DETAILS_MOTIFS_MODERATION } from "@sos-miam/commun/contenus/motifs-moderation";
import type { MonArticleActus } from "@sos-miam/commun/types/actus";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import { Bouton } from "~/composants/interface/Bouton";
import type { TEXTES_MES_ARTICLES_ACTUS } from "~/contenus/textes-mes-articles-actus";
import { ecrireDateArticle } from "~/fonctions/actus/ecrire-date-article";
import { utiliserLangue } from "~/hooks/utiliser-langue";

type Props = {
  article: MonArticleActus<ImageSourcePropType>;
  T: Traduction<typeof TEXTES_MES_ARTICLES_ACTUS>;
  onOuvrir: () => void;
  onRetoucher: () => void;
  onContester: () => void;
};

const PASTILLES = {
  "en-relecture": "border-encre bg-jaune-clair text-encre",
  "a-retoucher": "border-encre bg-carte text-encre",
  publie: "border-encre bg-jaune text-nuit",
  refuse: "border-gris bg-ligne text-gris",
  retire: "border-gris bg-ligne text-gris",
  supprime: "border-gris bg-ligne text-gris",
} as const;

export function CarteMonArticleActus({ article, T, onOuvrir, onRetoucher, onContester }: Props) {
  const { langue } = utiliserLangue();
  const publie = article.statut === "publie";
  const details = publie && article.publieLe
    ? [T.publie(ecrireDateArticle(article.publieLe, langue), article.jaime, article.commentaires), article.lieuARepondu ? T.lieuARepondu : null].filter(Boolean).join(" · ")
    : `${T.statuts[article.statut]} · ${T.envoye(ecrireDateArticle(article.envoyeLe, langue))}`;

  const enTete = (
    <View className="flex-row items-center gap-3">
      <Image source={article.couverture} accessible={false} contentFit="cover" style={{ width: 56, height: 56, borderRadius: 12 }} />
      <View className="flex-1 gap-1">
        <Text className="font-texte-gras text-sm leading-5 text-encre">{article.titre}</Text>
        {publie ? (
          <Text className="font-texte text-xs text-gris">{details}</Text>
        ) : (
          <Text className={`self-start overflow-hidden rounded-full border-[1.5px] px-2 py-0.5 font-texte-gras text-[11px] ${PASTILLES[article.statut]}`}>{details}</Text>
        )}
      </View>
    </View>
  );

  if (publie) {
    return (
      <Pressable accessibilityRole="button" onPress={onOuvrir} className="rounded-[18px] border-2 border-encre bg-carte p-3 active:opacity-90">
        {enTete}
      </Pressable>
    );
  }

  return (
    <View className="gap-2.5 rounded-[18px] border-2 border-encre bg-carte p-3">
      {enTete}
      {article.retouche ? (
        <>
          <Text className="rounded-xl bg-ligne px-3 py-2.5 font-texte text-[13px] leading-5 text-encre">
            <Text className="font-texte-gras">{`${T.brigade} `}</Text>
            {article.retouche.message}
          </Text>
          <Bouton libelle={T.retoucher} petit className="self-start" onPress={onRetoucher} />
        </>
      ) : null}
      {article.statut === "retire" ? (
        <>
          <Text className="font-texte text-[13px] leading-5 text-encre">{T.retire}</Text>
          <Pressable accessibilityRole="button" onPress={onContester} className="min-h-11 justify-center self-start active:opacity-70">
            <Text className="font-texte-gras text-sm text-encre underline">{T.contester}</Text>
          </Pressable>
        </>
      ) : null}
      {article.refus ? (
        <>
          <Text className="font-texte text-[13px] leading-5 text-encre">{article.refus.motivation}</Text>
          <Text className="font-texte text-xs text-gris">{T.refus(DETAILS_MOTIFS_MODERATION[article.refus.motif].enClair)}</Text>
          <Pressable accessibilityRole="button" onPress={onContester} className="min-h-11 justify-center self-start active:opacity-70">
            <Text className="font-texte-gras text-sm text-encre underline">{T.contester}</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}
