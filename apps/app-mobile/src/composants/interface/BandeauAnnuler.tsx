import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

import { TEXTES_INTERFACE_PAR_LANGUE } from "~/contenus/textes-interface";
import { annoncerLecteurEcran } from "~/fonctions/interaction/annoncer-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import type { BandeauAnnulerAffiche } from "~/hooks/utiliser-bandeau-annuler";
import { utiliserLecteurEcran } from "~/hooks/utiliser-lecteur-ecran";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** utiliserBandeauAnnuler ; null : rien à montrer */
  bandeau: BandeauAnnulerAffiche | null;
  /** Distance depuis le bas de l'écran (au-dessus de la barre d'onglets) */
  bas: number;
  onFermer: () => void;
};

// Le temps d'atteindre « Annuler » ; plus long avec un lecteur d'écran, qui doit d'abord y aller
const DUREE = 6_000;
const DUREE_LECTEUR_ECRAN = 15_000;
// Le bandeau suit toujours une feuille qui se referme : on attend qu'elle soit partie, sinon VoiceOver, qui revient à l'écran,
// couperait l'annonce (même règle que FeuilleConfirmation et onRefermee)
const DELAI_ANNONCE = 500;

/**
 * Petit bandeau sombre en bas de l'écran après un retrait (« Lieu retiré »), avec « Annuler » pour tout remettre, comme Gmail
 * ou Instagram : retirer ne demande pas de confirmation, mais se rattrape. Il s'efface tout seul ; lu par VoiceOver et TalkBack.
 */
export function BandeauAnnuler({ bandeau, bas, onFermer }: Props) {
  const lecteurEcran = utiliserLecteurEcran();
  const T = utiliserTextes(TEXTES_INTERFACE_PAR_LANGUE);

  useEffect(() => {
    if (!bandeau) return;
    const annonce = setTimeout(() => annoncerLecteurEcran(T.annonceBandeau(bandeau.texte)), DELAI_ANNONCE);
    const minuterie = setTimeout(onFermer, lecteurEcran ? DUREE_LECTEUR_ECRAN : DUREE);
    return () => {
      clearTimeout(annonce);
      clearTimeout(minuterie);
    };
  }, [bandeau, lecteurEcran, onFermer, T]);

  if (!bandeau) return null;
  return (
    // Position dans style, pas en className : NativeWind ignore className sur un Animated.View qui a un style
    <Animated.View key={bandeau.numero} entering={FadeInDown.duration(200)} exiting={FadeOutDown.duration(200)} style={{ position: "absolute", left: 16, right: 16, bottom: bas }}>
      <View className="min-h-14 flex-row items-center gap-3 rounded-2xl border-2 border-encre bg-nuit py-1.5 pl-3.5 pr-1.5">
        <Text className="flex-1 font-texte-semi text-[15px] text-white">{bandeau.texte}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.annuler}
          accessibilityHint={T.indiceAnnulerBandeau}
          onPress={() => {
            vibrerLegerement();
            bandeau.annuler();
            onFermer();
            annoncerLecteurEcran(T.remis);
          }}
          className="min-h-11 items-center justify-center rounded-full px-4 active:opacity-70"
        >
          <Text className="font-texte-gras text-[15px] text-jaune">{T.annuler}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
