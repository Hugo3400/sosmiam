import { useRouter } from "expo-router";
import { ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CarteMonArticleActus } from "~/composants/actus/CarteMonArticleActus";
import { EnTeteEcranActus } from "~/composants/actus/EnTeteEcranActus";
import { ProgressionBadgeActus } from "~/composants/actus/ProgressionBadgeActus";
import { BarreEtatTheme } from "~/composants/interface/BarreEtatTheme";
import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_MES_ARTICLES_ACTUS_PAR_LANGUE } from "~/contenus/textes-mes-articles-actus";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserFermerPile } from "~/hooks/utiliser-fermer-pile";
import { utiliserMesArticlesActus } from "~/hooks/utiliser-mes-articles-actus";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export default function EcranMesArticlesActus() {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const fermer = utiliserFermerPile();
  const T = utiliserTextes(TEXTES_MES_ARTICLES_ACTUS_PAR_LANGUE);
  const { articles: mesArticles, chargement } = utiliserMesArticlesActus();
  const publies = mesArticles.filter((a) => a.statut === "publie").length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <BarreEtatTheme />
      <EnTeteEcranActus titre={T.titre} retour={T.retour} onRetour={fermer} />
      <ScrollView contentContainerClassName="gap-3.5 px-4 pb-10 pt-2">
        <ProgressionBadgeActus publies={publies} T={T} />
        {!chargement && mesArticles.length === 0 ? <Text className="px-2 pt-6 text-center font-texte text-base leading-6 text-gris">{T.vide}</Text> : null}
        {mesArticles.map((article) => (
          <CarteMonArticleActus
            key={article.id}
            article={article}
            T={T}
            onOuvrir={() => router.push({ pathname: "/actus/[id]", params: { id: String(article.id) } })}
            onRetoucher={() => router.push({ pathname: "/actus/ecrire/[rubrique]", params: { rubrique: article.rubrique, retouche: String(article.id) } })}
            onContester={() => router.push("/reglages/decisions-moderation")}
          />
        ))}
        <Bouton libelle={T.ecrire} variante="blanc" className="mt-2" onPress={() => router.push("/actus/ecrire")} />
      </ScrollView>
    </SafeAreaView>
  );
}
