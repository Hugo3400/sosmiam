import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { Bouton } from "~/composants/interface/Bouton";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { formaterDistance } from "~/fonctions/geo/formater-distance";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import couleurs from "~/theme/couleurs";

/** Fiche d'un lieu (première version) : ses infos, ses horaires, son plat signature, et de quoi y aller ou l'aider. */
export default function FicheLieu() {
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profil } = utiliserProfil();
  const activite = utiliserActivite();
  const age = profil ? calculerAge(profil.dateNaissance) : null;
  const lieu = filtrerLieuxSelonAge(lieuxExemples, age).find((l) => String(l.id) === id);

  if (!lieu) {
    return (
      <View style={{ flex: 1, paddingTop: marges.top + 24 }} className="items-center gap-4 bg-creme px-8">
        <Text className="text-center font-titre text-2xl text-encre">Ce lieu n'est pas disponible</Text>
        <Bouton libelle="Retour" variante="blanc" onPress={() => router.back()} />
      </View>
    );
  }

  const sauve = activite.aSauve(lieu.id);
  const sections = [
    { emoji: "🕐", titre: "Horaires", texte: lieu.horaires },
    { emoji: "😋", titre: "Le plat signature", texte: lieu.plat },
    ...(lieu.decouvertPar ? [{ emoji: "🔎", titre: "Déniché par", texte: lieu.decouvertPar }] : []),
  ];

  return (
    <View className="flex-1 bg-creme">
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: marges.bottom + 120 }}>
        <LinearGradient colors={lieu.couleurs} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ height: 260 + marges.top, alignItems: "center", justifyContent: "center" }}>
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ fontSize: 110, marginTop: marges.top }}>{lieu.emoji}</Text>
        </LinearGradient>

        <View className="gap-4 px-5 pt-5">
          <View className="flex-row flex-wrap gap-2">
            {lieu.sos ? (
              <Text className="overflow-hidden rounded-full border-2 border-encre bg-jaune px-3 py-1 font-texte-gras text-[13px] text-encre">
                🛟 SOS · {lieu.sos.places} places jusqu'à {formaterHeure(lieu.sos.jusqua)}{lieu.sos.offre ? ` · ${lieu.sos.offre}` : ""}
              </Text>
            ) : null}
            {lieu.alerte ? (
              <Text className="overflow-hidden rounded-full bg-rose-alerte px-3 py-1 font-texte-gras text-[13px] text-rouge-texte">🔥 {lieu.alerte}</Text>
            ) : null}
          </View>
          <Text accessibilityRole="header" className="font-titre text-[34px] leading-[38px] text-encre">{lieu.nom}</Text>
          <Text className="font-texte-moyen text-base text-gris">
            {lieu.info} · 📍 {lieu.quartier}, {lieu.ville} · {formaterDistance(lieu.km)} · {lieu.prix}
          </Text>
          <Text className="font-texte text-[17px] leading-[26px] text-encre">{lierPonctuation(lieu.texte)}</Text>

          <View className="gap-3 rounded-carte border-2 border-encre bg-white p-5">
            {sections.map((s) => (
              <View key={s.titre} className="flex-row gap-3">
                <Text className="text-xl">{s.emoji}</Text>
                <View className="flex-1">
                  <Text className="font-texte-gras text-[15px] text-encre">{s.titre}</Text>
                  <Text className="font-texte text-[15px] text-gris">{s.texte}</Text>
                </View>
              </View>
            ))}
          </View>

          <View className="flex-row flex-wrap gap-2">
            {lieu.tags.map((tag) => (
              <Text key={tag} className="overflow-hidden rounded-full bg-jaune-clair px-3 py-1.5 font-texte-moyen text-sm text-encre">{tag}</Text>
            ))}
          </View>
        </View>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retour"
        hitSlop={8}
        onPress={() => router.back()}
        style={{ top: marges.top + 8 }}
        className="absolute left-4 h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
      >
        <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
      </Pressable>

      <View style={{ paddingBottom: marges.bottom + 12 }} className="absolute inset-x-0 bottom-0 flex-row gap-3 border-t border-ligne bg-creme px-5 pt-3">
        <Bouton
          className="flex-1"
          libelle={sauve ? "🛟 Sauvé !" : "🛟 À la rescousse"}
          variante={sauve ? "encre" : "jaune"}
          onPress={() => {
            // Premier à sauver un lieu tout juste arrivé : badge et points « Premier sauveteur »
            if (activite.basculerRescousse(lieu.id) === "donnee" && lieu.nouveau && !lieu.decouvertPar) activite.noterPremierSauvetage(lieu.id);
          }}
        />
        <Bouton
          className="flex-1"
          libelle="🗺️ Y aller"
          variante="blanc"
          indice="Ouvre l'itinéraire dans Plans"
          onPress={() => Linking.openURL(`https://maps.apple.com/?q=${encodeURIComponent(`${lieu.nom}, ${lieu.ville}`)}`)}
        />
      </View>
    </View>
  );
}
