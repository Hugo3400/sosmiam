import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import couleurs from "~/theme/couleurs";

/** Onglets du mode ambassadeur (provisoire : l'Espace seulement). */
export default function MiseEnPageOngletsAmbassadeur() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: couleurs.encre,
        tabBarInactiveTintColor: couleurs.gris,
        tabBarStyle: { backgroundColor: couleurs.creme, borderTopColor: couleurs.ligne },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Espace",
          // Sinon VoiceOver dit la position en anglais (« tab, 1 of 1 »)
          tabBarAccessibilityLabel: "Espace, onglet 1 sur 1",
          tabBarIcon: ({ color, size }) => <Ionicons name="ribbon" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
