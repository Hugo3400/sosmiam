import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BarreProgression } from "~/composants/interface/BarreProgression";
import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_INSCRIPTION_ACCUEIL_PAR_LANGUE } from "~/contenus/textes-inscription-accueil";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Action = { libelle: string; onPress: () => void; desactive?: boolean };

type Props = {
  titre: string;
  sousTitre?: string;
  /** Position dans le parcours, pour la barre de progression */
  etape?: { numero: number; total: number };
  /** Bouton « retour » en haut à gauche */
  retour?: boolean;
  /** Action du bouton retour (par défaut : l'écran précédent) */
  onRetour?: () => void;
  /** Bouton en bas de l'écran ; absent quand les actions sont dans le contenu (ex. « Crée ton compte ») */
  boutonPrincipal?: Action;
  /** Lien discret sous le bouton (ex. « Passer ») */
  boutonSecondaire?: Action;
  children: ReactNode;
};

/** Cadre commun des étapes d'inscription : retour et progression en haut, titre, contenu qui défile, bouton en bas (au-dessus du clavier). */
export function EcranEtape({ titre, sousTitre, etape, retour = true, onRetour, boutonPrincipal, boutonSecondaire, children }: Props) {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const T = utiliserTextes(TEXTES_INSCRIPTION_ACCUEIL_PAR_LANGUE);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View className="min-h-14 flex-row items-center gap-3 px-5 pt-2 pb-3">
          {retour ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={T.retour}
              hitSlop={12}
              onPress={onRetour ?? (() => router.back())}
              className="h-10 w-10 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
            >
              <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
            </Pressable>
          ) : null}
          {etape ? <BarreProgression etape={etape.numero} total={etape.total} /> : null}
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8" keyboardShouldPersistTaps="handled">
          <Text accessibilityRole="header" className="font-titre text-[32px] leading-[36px] text-encre">{lierPonctuation(titre)}</Text>
          {sousTitre ? <Text className="mt-2 font-texte text-base leading-6 text-gris">{lierPonctuation(sousTitre)}</Text> : null}
          <View className="mt-6">{children}</View>
        </ScrollView>

        {boutonPrincipal || boutonSecondaire ? (
        <View className="gap-3 border-t border-ligne bg-creme px-5 pt-4 pb-4">
          {boutonPrincipal ? (
            <Bouton libelle={boutonPrincipal.libelle} onPress={boutonPrincipal.onPress} desactive={boutonPrincipal.desactive} />
          ) : null}
          {boutonSecondaire ? (
            <Pressable accessibilityRole="button" onPress={boutonSecondaire.onPress} hitSlop={8} className="py-1 active:opacity-70">
              <Text className="text-center font-texte-semi text-base text-gris underline">{boutonSecondaire.libelle}</Text>
            </Pressable>
          ) : null}
        </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
