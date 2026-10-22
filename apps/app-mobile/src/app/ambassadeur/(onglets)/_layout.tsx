import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserEspaceAmbassadeur } from "~/hooks/utiliser-espace-ambassadeur";
import { utiliserModes } from "~/hooks/utiliser-modes";

/**
 * Onglets du mode ambassadeur : l'Espace pour tous, puis Missions, Relectures et Messages pour un ambassadeur actif (une
 * candidature en cours, refusée ou en pause n'a que l'Espace). Les pastilles comptent ce qui t'attend.
 */
export default function MiseEnPageOngletsAmbassadeur() {
  const couleurs = utiliserCouleurs();
  const { roles } = utiliserModes();
  const { espace } = utiliserEspaceAmbassadeur();
  const actif = (espace?.statut ?? roles.ambassadeur) === "actif";
  const total = actif ? 4 : 1;
  const pastille = (n: number | undefined) => (n ? n : undefined);
  const onglet = (nom: string, i: number) => `${nom}, onglet ${i} sur ${total}`;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: couleurs.encre,
        tabBarInactiveTintColor: couleurs.gris,
        tabBarStyle: { backgroundColor: couleurs.creme, borderTopColor: couleurs.ligne },
        tabBarBadgeStyle: { backgroundColor: couleurs.jaune, color: couleurs.nuit },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Espace", tabBarAccessibilityLabel: onglet("Espace", 1), tabBarIcon: ({ color, size }) => <Ionicons name="ribbon" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="missions"
        options={{
          title: "Missions",
          href: actif ? undefined : null,
          tabBarBadge: pastille(espace?.missionsAFaire),
          tabBarAccessibilityLabel: onglet("Missions", 2),
          tabBarIcon: ({ color, size }) => <Ionicons name="compass" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="relectures"
        options={{
          title: "Relectures",
          href: actif ? undefined : null,
          tabBarBadge: pastille(espace?.avisARelire),
          tabBarAccessibilityLabel: onglet("Relectures", 3),
          tabBarIcon: ({ color, size }) => <Ionicons name="search" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          href: actif ? undefined : null,
          tabBarBadge: pastille(espace?.messagesNonLus),
          tabBarAccessibilityLabel: onglet("Messages", 4),
          tabBarIcon: ({ color, size }) => <Ionicons name="mail" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
