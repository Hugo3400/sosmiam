import { Image } from "expo-image";
import { Text, View, type ImageSourcePropType } from "react-native";

import { DETAILS_MOTIFS_MODERATION_PAR_LANGUE } from "@sos-miam/commun/contenus/motifs-moderation";
import type { ArticleCitantLieuActus } from "@sos-miam/commun/types/actus";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import { Bouton } from "~/composants/interface/Bouton";
import type { TEXTES_ACTUS_PRO } from "~/contenus/textes-actus-pro";
import { ecrireDateArticle } from "~/fonctions/actus/ecrire-date-article";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  article: ArticleCitantLieuActus<ImageSourcePropType>;
  T: Traduction<typeof TEXTES_ACTUS_PRO>;
  onLire: () => void;
  onRepondre: () => void;
};

export function CarteArticleCitantLieu({ article, T, onLire, onRepondre }: Props) {
  const { langue } = utiliserLangue();
  const motifs = utiliserTextes(DETAILS_MOTIFS_MODERATION_PAR_LANGUE);
  const { reponse } = article;
  const peutRepondre = reponse === null || (reponse.statut === "refuse" && reponse.peutReecrire);
  return (
    <View className="gap-3 rounded-[18px] border-2 border-encre bg-carte p-3">
      <View accessible className="flex-row items-center gap-3">
        <Image source={article.couverture} accessible={false} contentFit="cover" style={{ width: 56, height: 56, borderRadius: 12 }} />
        <View className="flex-1 gap-1">
          <Text className="font-texte-gras text-sm leading-5 text-encre">{article.titre}</Text>
          <Text className="font-texte text-xs text-gris">{T.par(article.auteur, ecrireDateArticle(article.publieLe, langue))}</Text>
        </View>
      </View>
      {reponse ? (
        <View className="gap-1 rounded-xl bg-ligne px-3 py-2.5">
          <Text className="font-texte-gras text-[13px] text-encre">{T.reponses[reponse.statut]}</Text>
          <Text className="font-texte text-[13px] leading-5 text-encre">{reponse.texte}</Text>
          {reponse.motif ? <Text className="font-texte text-xs text-gris">{T.motif(motifs[reponse.motif].enClair)}</Text> : null}
        </View>
      ) : null}
      <View className="flex-row flex-wrap gap-2">
        <Bouton libelle={T.lire} variante="blanc" petit onPress={onLire} />
        {peutRepondre ? <Bouton libelle={reponse ? T.reecrire : T.repondre} petit onPress={onRepondre} /> : null}
      </View>
    </View>
  );
}
