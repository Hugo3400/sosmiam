import { useBottomTabBarHeight } from "expo-router/tabs";
import { Alert, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { etapesEnvies } from "~/contenus/inscription/envies";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import couleurs from "~/theme/couleurs";

/** Onglet « Profil » : tes infos et tes envies, et de quoi tout effacer pour refaire l'inscription. */
export default function Profil() {
  const { profil, effacer } = utiliserProfil();
  // La barre d'onglets est posée par-dessus l'écran : la fin de la page passe au-dessus
  const hauteurBarreOnglets = useBottomTabBarHeight();
  if (!profil) return null;

  function refaireInscription() {
    // Sur le web (aperçu de développement), Alert n'existe pas : on efface directement
    if (Platform.OS === "web") return void effacer();
    Alert.alert("Refaire l'inscription ?", "Ton profil sera effacé de ce téléphone et tu repartiras de la bienvenue.", [
      { text: "Annuler", style: "cancel" },
      { text: "Effacer et recommencer", style: "destructive", onPress: () => void effacer() },
    ]);
  }

  const categories = etapesEnvies.filter((etape) => (profil.envies[etape.categorie] ?? []).length > 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]}>
      <ScrollView contentContainerClassName="gap-6 px-5 pt-6" contentContainerStyle={{ paddingBottom: hauteurBarreOnglets + 24 }}>
        <View className="flex-row items-center gap-4">
          <Mascotte expression="clin" taille={72} />
          <View className="flex-1">
            <Text accessibilityRole="header" className="font-titre text-3xl text-encre">
              {profil.prenom}{profil.nom ? ` ${profil.nom}` : ""}
            </Text>
            <Text className="font-texte text-base text-gris">
              📍 {profil.ville} · {calculerAge(profil.dateNaissance)} ans
            </Text>
          </View>
        </View>

        <View className="gap-4 rounded-carte border-2 border-encre bg-white p-5">
          <Text className="font-titre-gras text-xl text-encre">Tes envies</Text>
          {categories.length === 0 ? (
            <Text className="font-texte text-base text-gris">Aucune envie choisie pour l'instant.</Text>
          ) : (
            categories.map((etape) => {
              const coches = profil.envies[etape.categorie] ?? [];
              const libelles = etape.choix.filter((choix) => coches.includes(choix.id));
              return (
                <View key={etape.categorie} className="gap-2">
                  <Text className="font-texte-semi text-base text-encre">{etape.emoji} {etape.nom}</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {libelles.map((choix) => (
                      <View key={choix.id} className="rounded-full bg-jaune-clair px-3 py-1.5">
                        <Text className="font-texte-moyen text-sm text-encre">{choix.emoji} {choix.libelle}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })
          )}
        </View>

        <Text className="font-texte text-sm leading-5 text-gris">
          🔒 Tes infos restent sur ce téléphone, dans son coffre-fort chiffré. Elles rejoindront ton compte quand notre serveur sera prêt.
        </Text>
        <Bouton libelle="Refaire l'inscription" variante="blanc" indice="Efface ton profil de ce téléphone" onPress={refaireInscription} />
      </ScrollView>
    </SafeAreaView>
  );
}
