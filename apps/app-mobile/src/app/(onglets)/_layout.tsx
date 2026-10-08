import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { BottomTabBar } from "expo-router/tabs";
import type { ComponentProps } from "react";

import { BandeauxOnglets } from "~/composants/visites/BandeauxOnglets";
import { utiliserVisites } from "~/hooks/utiliser-visites";
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

// Badge de l'onglet Scan : le nombre d'avis à donner, ou un simple point quand une addition attend
const STYLE_BADGE = { backgroundColor: couleurs.tomate, color: couleurs.encre, fontFamily: "Inter_700Bold" };
const STYLE_POINT = { backgroundColor: couleurs.tomate, minWidth: 11, width: 11, height: 11, borderRadius: 5.5, paddingHorizontal: 0, top: -1, end: -1, borderWidth: 1.5, borderColor: couleurs.creme };

/**
 * Barre d'onglets du bas : Pour toi, Explorer, Scan, Potes, Profil. Transparente sur « Pour toi ».
 * Elle est toujours posée par-dessus les écrans : ils gardent la même taille d'un onglet à l'autre (sinon le fil vidéo se recalcule en entier),
 * et chaque écran laisse lui-même la place en bas avec useBottomTabBarHeight.
 * Au-dessus d'elle, les bandeaux (ta demande d'addition en cours…) ; sur l'onglet Scan, un badge (avis à donner, addition en attente).
 */
export default function MiseEnPageOnglets() {
  const { enCours, aEcrire } = utiliserVisites();
  const badgeScan = aEcrire.length > 0 ? aEcrire.length : enCours ? "" : undefined;
  const infoScan = aEcrire.length > 0 ? `${aEcrire.length} avis à donner` : enCours ? "une addition en attente" : null;
  return (
    <Tabs
      // Les bandeaux d'abord : VoiceOver les lit avant les onglets
      tabBar={(props) => (
        <>
          <BandeauxOnglets ongletActif={props.state.routes[props.state.index]?.name ?? ""} />
          <BottomTabBar {...props} />
        </>
      )}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: couleurs.encre,
        tabBarInactiveTintColor: couleurs.gris,
        tabBarStyle: { position: "absolute", backgroundColor: couleurs.creme, borderTopColor: couleurs.ligne },
      }}
    >
      {onglets.map((onglet, index) => (
        <Tabs.Screen
          key={onglet.nom}
          name={onglet.nom}
          options={{
            title: onglet.titre,
            // Sinon VoiceOver dit la position en anglais (« tab, 2 of 5 »)
            tabBarAccessibilityLabel: `${onglet.titre}, onglet ${index + 1} sur ${onglets.length}${onglet.nom === "scan" && infoScan ? `, ${infoScan}` : ""}`,
            tabBarIcon: ({ color, size }) => <Ionicons name={onglet.icone} color={color} size={size} />,
            // « Pour toi » : barre transparente posée sur les vidéos, icônes blanches
            ...(onglet.nom === "index" ? ongletTransparent : {}),
            ...(onglet.nom === "scan" ? { tabBarBadge: badgeScan, tabBarBadgeStyle: badgeScan === "" ? STYLE_POINT : STYLE_BADGE } : {}),
          }}
        />
      ))}
    </Tabs>
  );
}
