import { Text, View } from "react-native";

import { calculerMinutesLecture } from "@sos-miam/commun/fonctions/actus/calculer-minutes-lecture";
import type { LieuCiteActus } from "@sos-miam/commun/types/actus";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import { AuteurArticle } from "~/composants/actus/AuteurArticle";
import { CorpsArticle } from "~/composants/actus/CorpsArticle";
import { LieuCiteArticle } from "~/composants/actus/LieuCiteArticle";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";
import type { TEXTES_ACTUS } from "~/contenus/textes-actus";
import type { ArticleActusAffiche } from "~/contenus/type-article-actus";
import { ecrireDateArticle } from "~/fonctions/actus/ecrire-date-article";
import { utiliserLangue } from "~/hooks/utiliser-langue";

type Props = {
  article: ArticleActusAffiche;
  T: Traduction<typeof TEXTES_ACTUS>;
  onVoir: (lieu: LieuCiteActus) => void;
  onYAller: (lieu: LieuCiteActus) => void;
};

export function ContenuArticle({ article, T, onVoir, onYAller }: Props) {
  const { langue } = utiliserLangue();
  const A = T.article;
  const minutes = calculerMinutesLecture(article.paragraphes);
  const villes = [...new Set(article.lieux.map((l) => l.ville))].join(", ");
  const date = ecrireDateArticle(article.publieLe, langue);
  const classement = article.rubrique === "top-quartier";

  return (
    <>
      <View className="gap-3">
        <Text className="font-texte-gras text-xs uppercase tracking-wide text-gris">{T.rubriques[article.rubrique]}</Text>
        <Text accessibilityRole="header" className="font-titre text-[30px] leading-[34px] text-encre">
          {article.titre}
        </Text>
        <Text className="font-texte-moyen text-[17px] leading-6 text-gris">{article.accroche}</Text>
        {article.collaboration ? (
          <Text className="self-start rounded-md border border-gris px-2 py-0.5 font-texte-gras text-xs text-gris">{T.mentionCollaboration}</Text>
        ) : null}
        {article.finLe ? <Text className="font-texte-gras text-sm text-encre">{A.finLe(ecrireDateArticle(article.finLe, langue))}</Text> : null}
        <AuteurArticle auteur={article.auteur} ambassadeur={T.ambassadeur} details={`${villes} · ${date} · ${T.minutesLecture(minutes)}`} />
      </View>

      <CorpsArticle paragraphes={article.paragraphes} citation={article.citation} photos={article.photos} photoLu={A.photoLu} />

      {article.alcool ? <MentionPrevention variante="bloc" /> : null}

      {article.lieux.length > 0 ? (
        <View className="gap-3">
          <Text accessibilityRole="header" className="font-titre-gras text-lg text-encre">
            {A.lieuxTitre(article.lieux.length)}
          </Text>
          {article.lieux.map((lieu, i) => (
            <LieuCiteArticle key={lieu.id} lieu={lieu} rang={classement ? i + 1 : null} T={A} onVoir={onVoir} onYAller={onYAller} />
          ))}
        </View>
      ) : null}
    </>
  );
}
