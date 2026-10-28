import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import type { MiamiPresent } from "@sos-miam/commun/types/qui-est-la";
import { RondMiami } from "~/composants/miamis/RondMiami";
import { TEXTES_ACCUEIL_MIAMIS_PAR_LANGUE } from "~/contenus/textes-miamis";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  ville: string;
  total: number;
  presents: MiamiPresent[];
};

const AVATARS_MONTRES = 6;
const TAILLE_AVATAR = 34;

export function CarteQuiEstLaAccueil({ ville, total, presents }: Props) {
  const T = utiliserTextes(TEXTES_ACCUEIL_MIAMIS_PAR_LANGUE);
  const router = useRouter();
  const montres = presents.slice(0, AVATARS_MONTRES);
  const reste = Math.max(0, total - montres.length);

  return (
    <View className="gap-4 rounded-3xl border-2 border-encre bg-nuit p-5">
      <View className="gap-1">
        <Text className="font-texte-gras text-xs uppercase tracking-widest text-jaune">{T.presentsSurtitre(ville)}</Text>
        <Text accessibilityRole="header" className="font-titre text-[22px] leading-7 text-lait">
          {lierPonctuation(T.presentsTitre(total))}
        </Text>
      </View>
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 flex-row items-center">
          {montres.map((p, i) => (
            <View key={p.personne.id} style={{ marginLeft: i === 0 ? 0 : -10 }}>
              <RondMiami personne={p.personne} taille={TAILLE_AVATAR} />
            </View>
          ))}
          {reste > 0 ? <Text className="ml-2 font-texte-semi text-[13px] text-gris-nuit">+{reste}</Text> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            vibrerLegerement();
            router.push("/potes/miamis/qui-est-la");
          }}
          className="min-h-11 items-center justify-center rounded-full border-2 border-jaune bg-jaune px-4 active:opacity-80"
        >
          <Text className="font-texte-gras text-sm text-nuit">{T.presentsBouton}</Text>
        </Pressable>
      </View>
      <Text className="font-texte text-xs leading-4 text-gris-nuit">{lierPonctuation(T.presentsNote)}</Text>
    </View>
  );
}
