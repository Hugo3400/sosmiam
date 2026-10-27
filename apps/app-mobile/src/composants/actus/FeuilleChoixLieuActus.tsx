import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import type { TEXTES_ECRIRE_ACTUS } from "~/contenus/textes-ecrire-actus";
import { chercherLieuxActus } from "~/fonctions/actus/chercher-lieux-actus";

type Props = {
  visible: boolean;
  lieux: readonly Lieu[];
  exclus: readonly number[];
  T: Traduction<typeof TEXTES_ECRIRE_ACTUS>["formulaire"];
  onChoisir: (lieu: Lieu) => void;
  onFermer: () => void;
};

export function FeuilleChoixLieuActus({ visible, lieux, exclus, T, onChoisir, onFermer }: Props) {
  const [recherche, setRecherche] = useState("");
  const resultats = useMemo(() => chercherLieuxActus(lieux, recherche, exclus), [lieux, recherche, exclus]);

  return (
    <FeuilleBas visible={visible} titre={T.chercherTitre} onFermer={onFermer} pied={<Bouton libelle={T.fermer} variante="blanc" onPress={onFermer} />}>
      <View className="gap-3">
        <ChampTexte libelle={T.chercher} aide={T.chercherAide} valeur={recherche} onChangeTexte={setRecherche} autoFocus autoCorrect={false} returnKeyType="search" />
        {recherche.trim().length > 0 && resultats.length === 0 ? <Text className="font-texte text-sm leading-5 text-gris">{T.aucunLieu}</Text> : null}
        {resultats.map((lieu) => (
          <Pressable
            key={lieu.id}
            accessibilityRole="button"
            accessibilityLabel={`${lieu.nom}, ${lieu.quartier}, ${lieu.ville}`}
            onPress={() => {
              setRecherche("");
              onChoisir(lieu);
            }}
            className="min-h-12 flex-row items-center gap-3 rounded-2xl border-2 border-ligne bg-carte px-3 py-2 active:opacity-80"
          >
            <Text className="text-2xl">{lieu.emoji}</Text>
            <View className="flex-1">
              <Text className="font-texte-gras text-[15px] text-encre">{lieu.nom}</Text>
              <Text className="font-texte text-[13px] text-gris">{`${lieu.quartier} · ${lieu.ville}`}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </FeuilleBas>
  );
}
