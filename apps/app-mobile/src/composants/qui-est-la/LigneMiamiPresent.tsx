import { Pressable, Text, View } from "react-native";

import type { MiamiPresent } from "@sos-miam/commun/types/qui-est-la";
import { RondMiami } from "~/composants/miamis/RondMiami";
import { ActionMiamiPresent } from "~/composants/qui-est-la/ActionMiamiPresent";
import { TEXTES_QUI_EST_LA_PAR_LANGUE } from "~/contenus/textes-qui-est-la";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  present: MiamiPresent;
  coucouPossible: boolean;
  enCours: boolean;
  demande: boolean;
  onCoucou: () => void;
  onAjouter: () => void;
  onOuvrirSortie: (sortieId: string) => void;
};

export function LigneMiamiPresent({ present, coucouPossible, enCours, demande, onCoucou, onAjouter, onOuvrirSortie }: Props) {
  const T = utiliserTextes(TEXTES_QUI_EST_LA_PAR_LANGUE);
  const { organise } = present;
  const badge =
    present.dansTaBande ? null : present.coucou === "recu" ? T.aFaitCoucou : present.coucou === "reciproque" ? T.reciproque : null;

  return (
    <View className="flex-row items-center gap-3 rounded-[18px] border border-ligne bg-carte px-3 py-2.5">
      <RondMiami personne={present.personne} taille={46} />
      <View className="min-w-0 flex-1 gap-0.5">
        <Text numberOfLines={1} className="font-texte-gras text-sm text-encre">
          @{present.personne.pseudo}
        </Text>
        {present.dansTaBande ? <Text className="font-texte text-xs text-gris">{T.dansTaBande}</Text> : null}
        {organise ? (
          <Pressable accessibilityRole="link" hitSlop={6} onPress={() => onOuvrirSortie(organise.sortieId)} className="self-start active:opacity-70">
            <Text numberOfLines={2} className="font-texte-semi text-xs leading-4 text-encre underline">
              {T.organise(organise.titre)}
            </Text>
          </Pressable>
        ) : null}
        {badge ? (
          <View className="self-start rounded-md bg-jaune-clair px-1.5 py-0.5">
            <Text className="font-texte-gras text-[11px] text-encre">{badge}</Text>
          </View>
        ) : null}
      </View>
      <ActionMiamiPresent present={present} coucouPossible={coucouPossible} enCours={enCours} demande={demande} onCoucou={onCoucou} onAjouter={onAjouter} />
    </View>
  );
}
