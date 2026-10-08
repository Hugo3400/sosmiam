import { useRouter } from "expo-router";
import { Text, View } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Recommandation } from "@sos-miam/commun/types/potes";
import { Bouton } from "~/composants/interface/Bouton";
import { CarteSortie } from "~/composants/potes/CarteSortie";
import { RecommandationsRecues } from "~/composants/potes/RecommandationsRecues";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";

type Props = {
  /** Lieux reçus de tes potes, déjà limités à ceux que tu peux voir */
  recommandations: Recommandation[];
  /** Lieux que tu peux voir (sans les bars sous 18 ans), par identifiant */
  lieux: ReadonlyMap<number, Lieu>;
};

// Une sortie reste « à venir » quelques heures après son début (le temps du repas)
const DUREE_SORTIE = 4 * 3_600_000;

/** Onglet « Sorties » : les lieux reçus de tes potes, tes sorties à venir, « Nouvelle sortie », puis les sorties passées. */
export function SectionSorties({ recommandations, lieux }: Props) {
  const router = useRouter();
  const { sorties, potes } = utiliserCommunaute();
  const maintenant = Date.now();
  const aVenir = sorties.filter((s) => new Date(s.quand).getTime() + DUREE_SORTIE >= maintenant);
  // Les plus récentes d'abord
  const passees = sorties.filter((s) => new Date(s.quand).getTime() + DUREE_SORTIE < maintenant).reverse();
  const ouvrir = (id: string) => router.push({ pathname: "/potes/sortie/[id]", params: { id } });

  return (
    <View className="gap-8">
      {recommandations.length > 0 ? <RecommandationsRecues recommandations={recommandations} lieux={lieux} /> : null}

      <View className="gap-3">
        <View>
          <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
            Tes sorties
          </Text>
          <Text className="font-texte text-sm text-gris">Chacun propose ses lieux, tout le monde vote, et c'est plié.</Text>
        </View>

        {aVenir.length === 0 ? (
          <View className="items-center gap-2 rounded-carte border-2 border-dashed border-ligne px-6 py-8">
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-4xl">
              🗓️
            </Text>
            <Text className="text-center font-texte-gras text-base text-encre">Rien de prévu pour l'instant</Text>
            <Text className="text-center font-texte text-base leading-6 text-gris">
              {lierPonctuation(
                potes.length > 0
                  ? "Ton agenda est plus vide qu'un frigo un dimanche soir. Lance une sortie : tes potes votent pour le lieu, fini les « on va où ? » qui durent trois jours."
                  : "Ajoute d'abord un pote ou deux : une sortie en solo, c'est juste un dîner (très bien aussi, remarque).",
              )}
            </Text>
          </View>
        ) : (
          aVenir.map((s) => <CarteSortie key={s.id} sortie={s} lieux={lieux} passee={false} onOuvrir={ouvrir} />)
        )}

        {potes.length > 0 ? (
          <Bouton
            libelle="Nouvelle sortie"
            indice="Choisis tes potes et propose des lieux, puis tout le monde vote"
            onPress={() => router.push("/potes/nouvelle-sortie")}
            className="mt-2"
          />
        ) : (
          <Bouton libelle="Ajouter un pote" indice="Par son pseudo, ton lien ou ton QR code" onPress={() => router.push("/potes/ajouter")} className="mt-2" />
        )}
      </View>

      {passees.length > 0 ? (
        <View className="gap-3">
          <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
            Déjà vécues
          </Text>
          {passees.map((s) => (
            <CarteSortie key={s.id} sortie={s} lieux={lieux} passee onOuvrir={ouvrir} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
