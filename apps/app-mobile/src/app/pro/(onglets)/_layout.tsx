import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { compterDemandesARepondre } from "~/fonctions/reservations/compter-demandes-a-repondre";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserHorlogeMinute } from "~/hooks/utiliser-horloge-minute";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserReservationsPro } from "~/hooks/utiliser-reservations-pro";

/**
 * Onglets du mode pro : le Comptoir pour toute l'équipe, « Mon lieu » pour le gérant seulement (un membre de l'équipe
 * valide les visites, il ne règle ni la carte de fidélité ni la fiche).
 */
export default function MiseEnPageOngletsPro() {
  const couleurs = utiliserCouleurs();
  const { lieuPro } = utiliserModes();
  const { lecture } = utiliserReservationsPro();
  const { maintenantMs } = utiliserHorlogeMinute();
  const gerant = lieuPro?.role === "gerant";
  const total = gerant ? 3 : 2;
  const aRepondre = lecture.etat === "lu" ? compterDemandesARepondre(lecture.reservations, maintenantMs) : 0;
  const detailReservations = aRepondre === 0 ? "" : `, ${aRepondre} demande${aRepondre > 1 ? "s" : ""} à répondre`;
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
        name="reservations"
        options={{
          title: "Réservations",
          tabBarBadge: aRepondre > 0 ? aRepondre : undefined,
          tabBarBadgeStyle: { backgroundColor: couleurs.tomate, color: couleurs.nuit, fontWeight: "700" },
          tabBarAccessibilityLabel: `Réservations${detailReservations}, onglet 2 sur ${total}`,
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="mon-lieu"
        options={{
          title: "Mon lieu",
          href: gerant ? undefined : null,
          tabBarAccessibilityLabel: `Mon lieu, onglet 3 sur ${total}`,
          tabBarIcon: ({ color, size }) => <Ionicons name="storefront" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
