import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import { BoutonEcrireActus } from "~/composants/actus/BoutonEcrireActus";
import { CarteArticleActus } from "~/composants/actus/CarteArticleActus";
import { CarteArticleUne } from "~/composants/actus/CarteArticleUne";
import { FiltresRubriquesActus } from "~/composants/actus/FiltresRubriquesActus";
import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/textes-actus";
import { TEXTES_ECRIRE_ACTUS_PAR_LANGUE } from "~/contenus/textes-ecrire-actus";
import type { FiltreActus } from "~/contenus/type-filtre-actus";
import { utiliserListeActus } from "~/hooks/utiliser-liste-actus";
import { utiliserPeutEcrireActus } from "~/hooks/utiliser-peut-ecrire-actus";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = { margeHaut: number; margeBas: number; filtreDepart?: FiltreActus };

export function ListeActus({ margeHaut, margeBas, filtreDepart = null }: Props) {
  const T = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE);
  const E = utiliserTextes(TEXTES_ECRIRE_ACTUS_PAR_LANGUE);
  const router = useRouter();
  const { invite } = utiliserProfil();
  const peutEcrire = utiliserPeutEcrireActus();
  const [rubrique, setRubrique] = useState<FiltreActus>(filtreDepart);
  const { articles: liste, chargement, aUneSuite, chargerSuite } = utiliserListeActus(rubrique);
  const ouvrir = useCallback((id: number) => router.push({ pathname: "/actus/[id]", params: { id: String(id) } }), [router]);

  const enTete = (
    <View>
      <FiltresRubriquesActus choisie={rubrique} avecAbonnements={!invite} onChoisir={setRubrique} T={T} />
      {peutEcrire && !invite ? (
        <Pressable accessibilityRole="button" onPress={() => router.push("/actus/mes-articles")} className="min-h-11 justify-center self-end px-4 active:opacity-70">
          <Text className="font-texte-gras text-sm text-encre underline">{E.mesArticles}</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={liste}
        keyExtractor={(a) => String(a.id)}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: margeHaut, paddingBottom: margeBas + 96, gap: 14 }}
        ListHeaderComponent={enTete}
        onEndReached={aUneSuite ? () => void chargerSuite() : undefined}
        onEndReachedThreshold={1}
        ListEmptyComponent={chargement ? null : <Text className="px-6 pt-10 text-center font-texte text-base leading-6 text-gris">{rubrique === "abonnements" ? T.videAbonnements : rubrique ? T.videRubrique : T.vide}</Text>}
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
      {invite ? null : <BoutonEcrireActus libelle={E.bouton} libelleLu={E.boutonLu} bas={margeBas + 16} onPress={() => router.push("/actus/ecrire")} />}
    </View>
  );
}
