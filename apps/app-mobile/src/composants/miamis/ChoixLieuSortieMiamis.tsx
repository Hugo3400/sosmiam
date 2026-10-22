import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { ChoixLieu } from "~/composants/potes/ChoixLieu";
import { TEXTES_ORGANISER } from "~/contenus/textes-sorties-miamis";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  lieu: Lieu | null;
  onChoisir: (lieuId: number) => void;
  erreur?: string | null;
};

export function ChoixLieuSortieMiamis({ lieu, onChoisir, erreur }: Props) {
  const couleurs = utiliserCouleurs();
  const [ouvert, setOuvert] = useState(false);
  return (
    <View className="gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={lieu ? `${lieu.nom}, ${TEXTES_ORGANISER.changerLieu}` : TEXTES_ORGANISER.choisirLieu}
        onPress={() => {
          vibrerLegerement();
          setOuvert(true);
        }}
        className={`flex-row items-center gap-3 rounded-2xl border-2 bg-carte p-3 active:opacity-80 ${erreur ? "border-rouge-texte" : "border-encre"}`}
      >
        <View className="h-11 w-11 items-center justify-center rounded-xl bg-jaune-clair">
          {lieu ? <Text className="text-xl">{lieu.emoji}</Text> : <Ionicons name="location-outline" size={22} color={couleurs.encre} />}
        </View>
        <View className="flex-1">
          <Text numberOfLines={1} className="font-texte-gras text-[15px] text-encre">
            {lieu ? lieu.nom : TEXTES_ORGANISER.choisirLieu}
          </Text>
          <Text numberOfLines={1} className="font-texte text-xs text-gris">
            {lieu ? `${lieu.quartier} · ${lieu.ville} · ${TEXTES_ORGANISER.changerLieu}` : TEXTES_ORGANISER.lieuAide}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={couleurs.gris} />
      </Pressable>
      {erreur ? <Text className="font-texte-semi text-sm text-rouge-texte">{lierPonctuation(erreur)}</Text> : null}
      <Text className="font-texte text-xs leading-4 text-gris">{lierPonctuation(TEXTES_ORGANISER.ouNote)}</Text>
      <ChoixLieu
        visible={ouvert}
        titre={TEXTES_ORGANISER.choisirLieu}
        dejaChoisis={lieu ? [lieu.id] : []}
        onChoisir={(id) => {
          onChoisir(id);
          setOuvert(false);
        }}
        onFermer={() => setOuvert(false)}
      />
    </View>
  );
}
