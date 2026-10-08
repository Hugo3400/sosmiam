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

/** Barre d'onglets du bas : Pour toi, Explorer, Scan, Potes, Profil. */
export default function MiseEnPageOnglets() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: couleurs.encre,
        tabBarInactiveTintColor: couleurs.gris,
        tabBarStyle: { backgroundColor: couleurs.creme, borderTopColor: couleurs.ligne },
      }}
    >
      {onglets.map((onglet) => (
        <Tabs.Screen
          key={onglet.nom}
          name={onglet.nom}
          options={{
            title: onglet.titre,
            tabBarIcon: ({ color, size }) => <Ionicons name={onglet.icone} color={color} size={size} />,
          }}
        />
      ))}
    </Tabs>
  );
}
