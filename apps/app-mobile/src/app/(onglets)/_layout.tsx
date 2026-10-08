import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";

import couleurs from "~/theme/couleurs";

type NomIcone = ComponentProps<typeof Ionicons>["name"];

const onglets: { nom: string; titre: string; icone: NomIcone }[] = [
  { nom: "index", titre: "Pour toi", icone: "heart" },
  { nom: "explorer", titre: "Explorer", icone: "map" },
  { nom: "scan", titre: "Scan", icone: "qr-code" },
  { nom: "potes", titre: "Potes", icone: "people" },
  { nom: "profil", titre: "Profil", icone: "person-circle" },
];

const ongletTransparent = {
  tabBarStyle: { position: "absolute" as const, backgroundColor: "transparent", borderTopWidth: 0, elevation: 0 },
  tabBarActiveTintColor: "#FFFFFF",
  tabBarInactiveTintColor: "rgba(255,255,255,0.7)",
};

/**
 * Barre d'onglets du bas : Pour toi, Explorer, Scan, Potes, Profil. Transparente sur « Pour toi ».
 * Elle est toujours posée par-dessus les écrans : ils gardent la même taille d'un onglet à l'autre (sinon le fil vidéo se recalcule en entier),
 * et chaque écran laisse lui-même la place en bas avec useBottomTabBarHeight.
 */
export default function MiseEnPageOnglets() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: couleurs.encre,
        tabBarInactiveTintColor: couleurs.gris,
        tabBarStyle: { position: "absolute", backgroundColor: couleurs.creme, borderTopColor: couleurs.ligne },
      }}
    >
      {onglets.map((onglet) => (
        <Tabs.Screen
          key={onglet.nom}
          name={onglet.nom}
          options={{
            title: onglet.titre,
            tabBarIcon: ({ color, size }) => <Ionicons name={onglet.icone} color={color} size={size} />,
            // « Pour toi » : barre transparente posée sur les vidéos, icônes blanches
            ...(onglet.nom === "index" ? ongletTransparent : {}),
          }}
        />
      ))}
    </Tabs>
  );
}
