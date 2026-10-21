import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Bouton } from "~/composants/interface/Bouton";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

type Props = {
  titre?: string;
  sousTitre?: string;
  centre?: boolean;
  /** Bouton fixé en bas (ex. « Enregistrer ») */
  boutonPrincipal?: { libelle: string; onPress: () => void; desactive?: boolean; indice?: string };
  /** Dans le bas fixe, juste au-dessus du bouton principal (ex. le refus d'un compte limité) : toujours en vue, même quand le contenu défile */
  auDessusDuBouton?: ReactNode;
  onRetour?: () => void;
  libelleRetour?: string;
  children: ReactNode;
};

/** Cadre des écrans de réglages : bouton retour, grand titre, contenu qui défile et bouton principal fixé en bas. */
export function EcranReglage({ titre, sousTitre, centre = false, boutonPrincipal, auDessusDuBouton, onRetour, libelleRetour = "Retour", children }: Props) {
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View className="min-h-14 flex-row items-center px-5 pb-3 pt-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={libelleRetour}
            hitSlop={12}
            onPress={onRetour ?? (() => router.back())}
            className="h-10 w-10 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
          >
            <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
          </Pressable>
        </View>

        <ScrollView className="flex-1" contentContainerClassName={centre ? "flex-grow justify-center px-5 pb-8" : "px-5 pb-8"} keyboardShouldPersistTaps="handled">
          {titre ? (
            <Text accessibilityRole="header" className="font-titre text-[32px] leading-[36px] text-encre">
              {lierPonctuation(titre)}
            </Text>
          ) : null}
          {sousTitre ? <Text className="mt-2 font-texte text-base leading-6 text-gris">{lierPonctuation(sousTitre)}</Text> : null}
          <View className={titre || sousTitre ? "mt-6" : ""}>{children}</View>
        </ScrollView>

        {boutonPrincipal ? (
          <View className="gap-3 border-t border-ligne bg-creme px-5 pb-4 pt-4">
            {auDessusDuBouton}
            <Bouton libelle={boutonPrincipal.libelle} onPress={boutonPrincipal.onPress} desactive={boutonPrincipal.desactive} indice={boutonPrincipal.indice} />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
