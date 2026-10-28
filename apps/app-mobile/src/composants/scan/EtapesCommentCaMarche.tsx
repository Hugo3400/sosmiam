import { Linking, Pressable, Text, View } from "react-native";

import { TEXTES_SCAN_PAR_LANGUE } from "~/contenus/textes-scan";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

const ADRESSE_FAQ = "https://sosmiam.fr/faq";

/** « Comment ça marche ? » : les trois étapes d'une visite qui compte, et un lien vers la FAQ du site. */
export function EtapesCommentCaMarche() {
  const T = utiliserTextes(TEXTES_SCAN_PAR_LANGUE);
  const etapes = T.etapes.map((etape, i) => ({ ...etape, numero: String(i + 1) }));
  return (
    <View className="gap-4 rounded-carte border-2 border-encre bg-carte p-5">
      <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
        {T.commentTitre}
      </Text>
      {etapes.map((etape) => (
        <View key={etape.numero} accessible accessibilityLabel={T.etapeLue(etape.numero, etape.titre, etape.texte)} className="flex-row items-start gap-3">
          <View className="h-8 w-8 items-center justify-center rounded-full border-2 border-encre bg-jaune">
            <Text className="font-titre text-base text-nuit">{etape.numero}</Text>
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="font-texte-gras text-base text-encre">{lierPonctuation(etape.titre)}</Text>
            <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(etape.texte)}</Text>
          </View>
        </View>
      ))}
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={T.faqLu}
        hitSlop={8}
        onPress={() => {
          vibrerLegerement();
          Linking.openURL(ADRESSE_FAQ).catch(() => {});
        }}
        className="min-h-11 justify-center self-start active:opacity-60"
      >
        <Text className="font-texte-gras text-[15px] text-encre underline">{T.faq}</Text>
      </Pressable>
    </View>
  );
}
