import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";

import type { RubriqueActus } from "@sos-miam/commun/regles/actus";
import { CarteArticleActus } from "~/composants/actus/CarteArticleActus";
import { CarteArticleUne } from "~/composants/actus/CarteArticleUne";
import { FiltresRubriquesActus } from "~/composants/actus/FiltresRubriquesActus";
import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/textes-actus";
import { utiliserActus } from "~/hooks/utiliser-actus";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = { margeHaut: number; margeBas: number };

export function ListeActus({ margeHaut, margeBas }: Props) {
  const T = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE);
  const router = useRouter();
  const { articles } = utiliserActus();
  const [rubrique, setRubrique] = useState<RubriqueActus | null>(null);
  const liste = useMemo(() => (rubrique ? articles.filter((a) => a.rubrique === rubrique) : articles), [articles, rubrique]);
  const ouvrir = useCallback((id: number) => router.push({ pathname: "/actus/[id]", params: { id: String(id) } }), [router]);

  return (
    <FlatList
      data={liste}
      keyExtractor={(a) => String(a.id)}
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: margeHaut, paddingBottom: margeBas + 24, gap: 14 }}
      ListHeaderComponent={<FiltresRubriquesActus choisie={rubrique} onChoisir={setRubrique} T={T} />}
      ListEmptyComponent={
        <Text className="px-6 pt-10 text-center font-texte text-base leading-6 text-gris">{rubrique ? T.videRubrique : T.vide}</Text>
      }
      renderItem={({ item, index }) => (
        <View className="px-4">
          {index === 0 && item.aLaUne && rubrique === null ? (
            <CarteArticleUne article={item} T={T} onOuvrir={ouvrir} />
          ) : (
            <CarteArticleActus article={item} T={T} onOuvrir={ouvrir} />
          )}
        </View>
      )}
    />
  );
}
