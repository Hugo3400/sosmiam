import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import couleurs from "~/theme/couleurs";

type Props = {
  onRetour: () => void;
  centre?: boolean;
  pied?: ReactNode;
  children: ReactNode;
};

export function CadreAvis({ onRetour, centre = false, pied, children }: Props) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <View className="min-h-14 flex-row items-center px-5 pb-3 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={12}
          onPress={onRetour}
          className="h-10 w-10 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>
      </View>
      <ScrollView className="flex-1" contentContainerClassName={`flex-grow gap-6 px-5 pb-8 ${centre ? "justify-center" : ""}`}>
        {children}
      </ScrollView>
      {pied ? <View className="gap-3 border-t border-ligne bg-creme px-5 pb-4 pt-4">{pied}</View> : null}
    </SafeAreaView>
  );
}
