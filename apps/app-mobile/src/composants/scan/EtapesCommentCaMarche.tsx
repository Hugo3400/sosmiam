import { Linking, Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const ETAPES = [
  { numero: "1", titre: "Tu te régales, tu paies", texte: "Ta visite compte quand tu paies : c'est ce qui rend les avis vrais." },
  {
    numero: "2",
    titre: "Tu valides en un geste",
    texte: "Scanne le QR que te montre l'équipe, ou demande l'addition dans l'app. Une réservation faite ici et honorée compte aussi.",
  },
  { numero: "3", titre: "Tu en profites", texte: "+15 points (+25 pendant un SOS), un tampon sur ta carte de fidélité, et ton avis s'ouvre une heure après : pas devant le patron." },
] as const;

const ADRESSE_FAQ = "https://sosmiam.fr/faq";

/** « Comment ça marche ? » : les trois étapes d'une visite qui compte, et un lien vers la FAQ du site. */
export function EtapesCommentCaMarche() {
  return (
    <View className="gap-4 rounded-carte border-2 border-encre bg-white p-5">
      <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
        Comment ça marche ?
      </Text>
      {ETAPES.map((etape) => (
        <View key={etape.numero} accessible accessibilityLabel={`Étape ${etape.numero} : ${etape.titre}. ${etape.texte}`} className="flex-row items-start gap-3">
          <View className="h-8 w-8 items-center justify-center rounded-full border-2 border-encre bg-jaune">
            <Text className="font-titre text-base text-encre">{etape.numero}</Text>
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="font-texte-gras text-base text-encre">{lierPonctuation(etape.titre)}</Text>
            <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(etape.texte)}</Text>
          </View>
        </View>
      ))}
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Toutes les réponses dans la FAQ du site"
        hitSlop={8}
        onPress={() => {
          vibrerLegerement();
          Linking.openURL(ADRESSE_FAQ).catch(() => {});
        }}
        className="min-h-11 justify-center self-start active:opacity-60"
      >
        <Text className="font-texte-gras text-[15px] text-encre underline">Toutes les réponses dans la FAQ →</Text>
      </Pressable>
    </View>
  );
}
