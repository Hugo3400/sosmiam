import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import type { IdeeMiamis } from "@sos-miam/commun/types/idees";
import { LigneIdeeAccueil } from "~/composants/miamis/LigneIdeeAccueil";
import { TEXTES_ACCUEIL_MIAMIS } from "~/contenus/textes-miamis";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  idees: IdeeMiamis[];
  onVoter: (id: string, oui: boolean) => void;
};

const IDEES_MONTREES = 3;

export function ApercuIdeesAccueil({ idees, onVoter }: Props) {
  const router = useRouter();
  const meilleures = idees
    .filter((i) => i.statut !== "en-relecture")
    .sort((a, b) => b.votes - a.votes)
    .slice(0, IDEES_MONTREES);
  const ouvrirBoite = () => {
    vibrerLegerement();
    router.push("/potes/miamis/idees");
  };

  return (
    <View className="gap-3 px-5">
      <View className="gap-1.5">
        <View className="flex-row items-center justify-between gap-3">
          <Text accessibilityRole="header" className="flex-1 font-titre text-[22px] text-encre">
            {TEXTES_ACCUEIL_MIAMIS.ideesTitre}
          </Text>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={ouvrirBoite} className="min-h-11 justify-center active:opacity-70">
            <Text className="font-texte-gras text-[15px] text-encre underline">{TEXTES_ACCUEIL_MIAMIS.ideesLien}</Text>
          </Pressable>
        </View>
        <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(TEXTES_ACCUEIL_MIAMIS.ideesIntro)}</Text>
      </View>
      {meilleures.length === 0 ? (
        <Pressable accessibilityRole="button" onPress={ouvrirBoite} className="rounded-2xl border-2 border-dashed border-gris/50 px-4 py-4 active:opacity-80">
          <Text className="text-center font-texte text-sm leading-5 text-encre">{lierPonctuation(TEXTES_ACCUEIL_MIAMIS.ideesVide)}</Text>
        </Pressable>
      ) : (
        <View className="gap-2">
          {meilleures.map((idee, i) => (
            <LigneIdeeAccueil key={idee.id} idee={idee} rang={i + 1} onVoter={(oui) => onVoter(idee.id, oui)} />
          ))}
        </View>
      )}
    </View>
  );
}
