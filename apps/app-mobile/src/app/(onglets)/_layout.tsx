import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { BottomTabBar } from "expo-router/tabs";
import type { ComponentProps } from "react";

import { LibelleOnglet } from "~/composants/interface/LibelleOnglet";
import { BandeauxOnglets } from "~/composants/visites/BandeauxOnglets";
import { TEXTES_MESSAGES_PAR_LANGUE } from "~/contenus/textes-messages";
import { TEXTES_ONGLETS_PRINCIPAUX_PAR_LANGUE } from "~/contenus/textes-onglets-principaux";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { utiliserVisites } from "~/hooks/utiliser-visites";

type NomIcone = ComponentProps<typeof Ionicons>["name"];

const onglets: { nom: "index" | "explorer" | "scan" | "potes" | "profil"; icone: NomIcone }[] = [
  { nom: "index", icone: "heart" },
  { nom: "explorer", icone: "map" },
  { nom: "scan", icone: "qr-code" },
  { nom: "potes", icone: "people" },
  { nom: "profil", icone: "person-circle" },
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
 * Au-dessus d'elle, les bandeaux (ta demande d'addition en cours…) ; sur l'onglet Scan, un badge (avis à donner, addition en attente).
 */
export default function MiseEnPageOnglets() {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_ONGLETS_PRINCIPAUX_PAR_LANGUE).barre;
  const TM = utiliserTextes(TEXTES_MESSAGES_PAR_LANGUE);
  const { enCours, aEcrire } = utiliserVisites();
  // Badge de l'onglet Scan : le nombre d'avis à donner, ou un simple point quand une addition attend
  const styleBadge = { backgroundColor: couleurs.tomate, color: couleurs.nuit, fontFamily: "Inter_700Bold" };
  const stylePoint = { backgroundColor: couleurs.tomate, minWidth: 11, width: 11, height: 11, borderRadius: 5.5, paddingHorizontal: 0, top: -1, end: -1, borderWidth: 1.5, borderColor: couleurs.creme };
  const badgeScan = aEcrire.length > 0 ? aEcrire.length : enCours ? "" : undefined;
  const infoScan = aEcrire.length > 0 ? T.avisADonner(aEcrire.length) : enCours ? T.additionEnAttente : null;
  const { nonLus } = utiliserConversations();
  const badgeCommunaute = nonLus > 0 ? (nonLus > 99 ? "99+" : nonLus) : undefined;
  const infos: Record<string, string | null> = { scan: infoScan, potes: nonLus > 0 ? TM.messagesNonLus(nonLus) : null };
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
            title: T.titres[onglet.nom],
            // Sinon VoiceOver dit la position en anglais (« tab, 2 of 5 »)
            tabBarAccessibilityLabel: T.lu(T.titres[onglet.nom], index + 1, onglets.length, infos[onglet.nom] ?? null),
            tabBarIcon: ({ color, size }) => <Ionicons name={onglet.icone} color={color} size={size} />,
            tabBarLabel: ({ color, position }) => <LibelleOnglet titre={T.titres[onglet.nom]} color={color} position={position} />,
            // « Pour toi » : barre transparente posée sur les vidéos, icônes blanches
            ...(onglet.nom === "index" ? ongletTransparent : {}),
            ...(onglet.nom === "scan" ? { tabBarBadge: badgeScan, tabBarBadgeStyle: badgeScan === "" ? stylePoint : styleBadge } : {}),
            ...(onglet.nom === "potes" ? { tabBarBadge: badgeCommunaute, tabBarBadgeStyle: styleBadge } : {}),
          }}
        />
      ))}
    </Tabs>
  );
}
