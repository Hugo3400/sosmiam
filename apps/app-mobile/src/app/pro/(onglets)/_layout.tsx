import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import couleurs from "~/theme/couleurs";

/** Onglets du mode pro (provisoire : le Comptoir seulement). */
export default function MiseEnPageOngletsPro() {
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
        name="comptoir"
        options={{
          title: "Comptoir",
          // Sinon VoiceOver dit la position en anglais (« tab, 1 of 1 »)
          tabBarAccessibilityLabel: "Comptoir, onglet 1 sur 1",
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
