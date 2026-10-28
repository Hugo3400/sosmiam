import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";

import { TEXTES_ONGLETS_PRO_PAR_LANGUE } from "~/contenus/textes-ecran-pro-comptoir";
import { compterDemandesARepondre } from "~/fonctions/reservations/compter-demandes-a-repondre";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserHorlogeMinute } from "~/hooks/utiliser-horloge-minute";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserReservationsPro } from "~/hooks/utiliser-reservations-pro";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * Onglets du mode pro : le Comptoir pour toute l'équipe, « Mon lieu » pour le gérant seulement (un membre de l'équipe
 * valide les visites, il ne règle ni la carte de fidélité ni la fiche).
 */
export default function MiseEnPageOngletsPro() {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_ONGLETS_PRO_PAR_LANGUE);
  const { lieuPro } = utiliserModes();
  const { lecture } = utiliserReservationsPro();
  const { maintenantMs } = utiliserHorlogeMinute();
  const gerant = lieuPro?.role === "gerant";
  const total = gerant ? 3 : 2;
  const aRepondre = lecture.etat === "lu" ? compterDemandesARepondre(lecture.reservations, maintenantMs) : 0;
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
          title: T.comptoir,
          // Sinon VoiceOver dit la position en anglais (« tab, 1 of 2 »)
          tabBarAccessibilityLabel: T.comptoirLu(total),
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: T.reservations,
          tabBarBadge: aRepondre > 0 ? aRepondre : undefined,
          tabBarBadgeStyle: { backgroundColor: couleurs.tomate, color: couleurs.nuit, fontWeight: "700" },
          tabBarAccessibilityLabel: T.reservationsLu(aRepondre, total),
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="mon-lieu"
        options={{
          title: T.monLieu,
          href: gerant ? undefined : null,
          tabBarAccessibilityLabel: T.monLieuLu(total),
          tabBarIcon: ({ color, size }) => <Ionicons name="storefront" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
