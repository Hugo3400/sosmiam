import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { CarteMonArticleActus } from "~/composants/actus/CarteMonArticleActus";
import { EnTeteEcranActus } from "~/composants/actus/EnTeteEcranActus";
import { ProgressionBadgeActus } from "~/composants/actus/ProgressionBadgeActus";
import { Annonce } from "~/composants/interface/Annonce";
import { BarreEtatTheme } from "~/composants/interface/BarreEtatTheme";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
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
  const marges = useSafeAreaInsets();
  const { articles: mesArticles, chargement, supprimer } = utiliserMesArticlesActus();
  const [aSupprimer, setASupprimer] = useState<number | null>(null);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);

  async function confirmerSuppression() {
    if (aSupprimer === null) return;
    const ok = await supprimer(aSupprimer);
    const texte = ok ? T.supprimeAnnonce : T.supprimeEchec;
    setAnnonce((avant) => ({ texte, numero: (avant?.numero ?? 0) + 1 }));
  }
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
            onSupprimer={() => setASupprimer(article.id)}
          />
        ))}
        <Bouton libelle={T.ecrire} variante="blanc" className="mt-2" onPress={() => router.push("/actus/ecrire")} />
      </ScrollView>
      <FeuilleConfirmation
        visible={aSupprimer !== null}
        emoji="🗑️"
        titre={T.confirmation.titre}
        detail={T.confirmation.texte}
        libelleConfirmer={T.confirmation.confirmer}
        libelleRester={T.confirmation.garder}
        onConfirmer={() => void confirmerSuppression()}
        onFermer={() => setASupprimer(null)}
      />
      <Annonce annonce={annonce} haut={marges.top + 12} onFin={finAnnonce} />
    </SafeAreaView>
  );
}
