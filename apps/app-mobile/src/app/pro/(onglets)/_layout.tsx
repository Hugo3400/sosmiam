import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { utiliserModes } from "~/hooks/utiliser-modes";
import couleurs from "~/theme/couleurs";

/**
 * Onglets du mode pro : le Comptoir pour toute l'équipe, « Mon lieu » pour le gérant seulement (un membre de l'équipe
 * valide les visites, il ne règle ni la carte de fidélité ni la fiche). Réservations et avis arrivent ensuite.
 */
export default function MiseEnPageOngletsPro() {
  const { lieuPro } = utiliserModes();
  const gerant = lieuPro?.role === "gerant";
  const total = gerant ? 2 : 1;
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
          // Sinon VoiceOver dit la position en anglais (« tab, 1 of 2 »)
          tabBarAccessibilityLabel: `Comptoir, onglet 1 sur ${total}`,
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="mon-lieu"
        options={{
          title: "Mon lieu",
          href: gerant ? undefined : null,
          tabBarAccessibilityLabel: `Mon lieu, onglet 2 sur ${total}`,
          tabBarIcon: ({ color, size }) => <Ionicons name="storefront" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
