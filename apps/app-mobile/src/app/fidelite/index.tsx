import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Bouton } from "~/composants/interface/Bouton";
import { CarteFideliteListe } from "~/composants/fidelite/CarteFideliteListe";
import { Mascotte } from "~/composants/marque/Mascotte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserFermerPile } from "~/hooks/utiliser-fermer-pile";
import { utiliserVisites } from "~/hooks/utiliser-visites";
import couleurs from "~/theme/couleurs";

/**
 * « Mes cartes de fidélité » : une carte par lieu où tu as déjà un tampon, celles dont la récompense t'attend en premier.
 * On en touche une pour l'ouvrir en grand (tampons, récompense à demander au comptoir, tes visites là-bas).
 */
export default function EcranMesCartesFidelite() {
  const router = useRouter();
  const fermer = utiliserFermerPile();
  const { cartes, pret } = utiliserVisites();
  // Les récompenses prêtes d'abord, puis les cartes les plus avancées
  const triees = [...cartes].sort((a, b) => b.pretes.length - a.pretes.length || b.tampons / b.sur - a.tampons / a.sur);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <View className="min-h-14 flex-row items-center gap-3 px-5 pb-2 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={8}
          onPress={fermer}
          className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>
        <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
          Mes cartes de fidélité
        </Text>
      </View>

      <ScrollView contentContainerClassName="gap-4 px-5 pb-10 pt-2">
        {!pret ? (
          <Text className="py-10 text-center font-texte text-base text-gris">On sort tes cartes…</Text>
        ) : triees.length === 0 ? (
          <View className="items-center gap-4 rounded-carte border-2 border-dashed border-ligne bg-white px-6 py-8">
            <Mascotte expression="clin" taille={110} />
            <Text className="text-center font-titre-gras text-xl text-encre">Pas encore de carte</Text>
            <Text className="text-center font-texte text-base leading-6 text-gris">
              {lierPonctuation("Une visite validée dans un lieu qui a une carte de fidélité, et le premier tampon est posé. La récompense ? C'est le lieu qui la choisit.")}
            </Text>
            <Bouton libelle="Valider une visite" onPress={() => router.push("/scan")} />
          </View>
        ) : (
          <>
            <Text className="font-texte text-base leading-6 text-gris">{lierPonctuation("Un tampon à chaque visite validée. Carte pleine : ta récompense t'attend, à demander au comptoir.")}</Text>
            {triees.map((carte) => (
              <CarteFideliteListe key={carte.lieu.id} carte={carte} onPress={() => router.push({ pathname: "/fidelite/[lieuId]", params: { lieuId: String(carte.lieu.id) } })} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
