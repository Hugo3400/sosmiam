import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Linking, Platform, Text, View } from "react-native";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { ImageAvatar } from "~/composants/profil/ImageAvatar";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { LigneReglage } from "~/composants/reglages/LigneReglage";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { avatarsEmoji } from "~/contenus/avatars-emoji";
import { etapesEnvies } from "~/contenus/inscription/envies";
import { filtrerEtapesEnvies } from "~/fonctions/inscription/filtrer-etapes-envies";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { effacerReglagesNotifications } from "~/stockage/reglages-notifications";
import { effacerSignalementsLocaux } from "~/stockage/signalements-locaux";
import couleurs from "~/theme/couleurs";

const ADRESSE_CONTACT = "bonjour@sosmiam.fr";

/** Ouvre une page web ou l'appli Mail ; si le téléphone n'y arrive pas, on le dit gentiment (Alert n'existe pas sur le web). */
function ouvrirLien(adresse: string) {
  Linking.openURL(adresse).catch(() => {
    if (Platform.OS !== "web") {
      Alert.alert("Oups, ça ne veut pas s'ouvrir", `Ton téléphone n'a pas réussi à ouvrir ce lien. Tu peux aussi nous écrire à ${ADRESSE_CONTACT}.`);
    }
  });
}

/** Réglages, ouverts depuis le profil (⚙️) : ton profil, tes notifications, les pages légales et de quoi tout effacer. */
export default function Reglages() {
  const router = useRouter();
  const { profil, avatar, effacer } = utiliserProfil();
  const activite = utiliserActivite();
  const communaute = utiliserCommunaute();
  const conversations = utiliserConversations();
  const [effacementEnCours, setEffacementEnCours] = useState(false);
  if (!profil) return null;

  // Seules les envies que l'app peut montrer à cet âge sont comptées
  const etapes = filtrerEtapesEnvies(etapesEnvies, calculerAge(profil.dateNaissance));
  const nombreEnvies = etapes.reduce((total, etape) => {
    const coches = profil.envies[etape.categorie] ?? [];
    return total + etape.choix.filter((choix) => coches.includes(choix.id)).length;
  }, 0);
  const detailEnvies =
    nombreEnvies === 0 ? "Rien de coché pour l'instant" : `${nombreEnvies} envie${nombreEnvies > 1 ? "s" : ""} cochée${nombreEnvies > 1 ? "s" : ""}`;
  // L'avatar actuel est dit en toutes lettres (l'image à droite n'est pas lue par le lecteur d'écran)
  const detailAvatar =
    avatar.type === "photo"
      ? "Ta photo pour l'instant, ou un emoji"
      : `En ${avatarsEmoji.find((a) => a.emoji === avatar.emoji)?.nom ?? avatar.emoji} pour l'instant, ou en photo`;

  const version = Constants.expoConfig?.version;

  async function toutEffacer() {
    if (effacementEnCours) return;
    setEffacementEnCours(true);
    try {
      await activite.effacer();
      await communaute.effacer();
      await conversations.effacer();
      await effacerSignalementsLocaux();
      await effacerReglagesNotifications();
      // En dernier : sans profil, l'app repart toute seule à la bienvenue
      await effacer();
    } catch {
      setEffacementEnCours(false);
      if (Platform.OS !== "web") {
        Alert.alert("Oups, ça a coincé", "Une partie de tes données n'a pas pu être effacée. Réessaie dans un instant.");
      }
    }
  }

  function demanderEffacement() {
    // Sur le web (aperçu de développement), Alert n'existe pas : on efface directement
    if (Platform.OS === "web") return void toutEffacer();
    Alert.alert(
      "Tout effacer et recommencer ?",
      "Ton profil, ton avatar, tes rescousses, tes lieux gardés, tes J'aime, tes signalements et tes réglages de notifications vont disparaître de ce téléphone. Tu repartiras de la bienvenue, comme au premier jour.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Tout effacer", style: "destructive", onPress: () => void toutEffacer() },
      ],
    );
  }

  return (
    <EcranReglage titre="Réglages" sousTitre="Ton profil, tes alertes et tes données : ici, c'est toi qui décides.">
      <SectionReglages titre="Ton profil">
        <LigneReglage
          emoji="🎭"
          titre="Avatar"
          detail={detailAvatar}
          onPress={() => router.push("/reglages/avatar")}
          droite={
            <View className="flex-row items-center gap-2">
              <ImageAvatar avatar={avatar} taille={40} />
              <Ionicons name="chevron-forward" size={20} color={couleurs.gris} />
            </View>
          }
        />
        <LigneReglage
          emoji="🪪"
          titre="Mes infos"
          detail={`${profil.prenom}${profil.nom ? ` ${profil.nom}` : ""} · ${profil.ville}`}
          onPress={() => router.push("/reglages/infos")}
        />
        <LigneReglage emoji="😋" titre="Mes envies" detail={detailEnvies} onPress={() => router.push("/reglages/envies")} />
      </SectionReglages>

      <SectionReglages titre="Notifications">
        <LigneReglage
          emoji="🔔"
          titre="Mes notifications"
          detail="Les alertes qui t'intéressent, et du calme la nuit"
          onPress={() => router.push("/reglages/notifications")}
        />
      </SectionReglages>

      <SectionReglages titre="Confidentialité et aide">
        <LigneReglage
          emoji="🔐"
          titre="Politique de confidentialité"
          detail="Celle du site ; la partie de l'app arrive avant sa sortie"
          role="lien"
          onPress={() => ouvrirLien("https://sosmiam.fr/confidentialite")}
        />
        <LigneReglage
          emoji="📜"
          titre="Conditions d'utilisation"
          detail="Les règles du jeu, noir sur blanc"
          role="lien"
          onPress={() => ouvrirLien("https://sosmiam.fr/cgu")}
        />
        <LigneReglage
          emoji="⚖️"
          titre="Mentions légales"
          detail="Qui se cache derrière SOS Miam"
          role="lien"
          onPress={() => ouvrirLien("https://sosmiam.fr/mentions-legales")}
        />
        <LigneReglage
          emoji="💌"
          titre="Nous écrire"
          detail={`Une question, une idée, un bug\u00a0: ${ADRESSE_CONTACT}`}
          role="lien"
          onPress={() => ouvrirLien(`mailto:${ADRESSE_CONTACT}`)}
        />
      </SectionReglages>

      <SectionReglages titre="Tes données">
        <View className="flex-row gap-3 py-3">
          <Text accessibilityElementsHidden importantForAccessibility="no" className="text-base leading-5">
            🔒
          </Text>
          <Text className="flex-1 font-texte text-sm leading-5 text-gris">
            {lierPonctuation(
              "Tout reste sur ce téléphone : ton profil dans son coffre-fort chiffré, ton activité, ton avatar et tes préférences dans l'app. Rien n'est envoyé à notre serveur pour l'instant. Et quand ton compte arrivera, ta photo et ton régime particulier ne partiront pas sans ton accord.",
            )}
          </Text>
        </View>
        <LigneReglage
          emoji="🧽"
          titre="Effacer mes données et recommencer"
          detail="Profil, avatar, rescousses, lieux gardés… tout repart à zéro"
          danger
          onPress={demanderEffacement}
        />
      </SectionReglages>

      {version ? <Text className="text-center font-texte text-xs text-gris">SOS Miam · version {version}</Text> : null}
    </EcranReglage>
  );
}
