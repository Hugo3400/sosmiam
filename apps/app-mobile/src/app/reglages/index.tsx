import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { Alert, Linking, Platform, Text, View } from "react-native";

import { ADRESSE_PAGE_PREVENTION } from "@sos-miam/commun/contenus/prevention-alcool";
import { ImageAvatar } from "~/composants/profil/ImageAvatar";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { LigneReglage } from "~/composants/reglages/LigneReglage";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { avatarsEmoji } from "~/contenus/avatars-emoji";
import { etapesEnvies } from "~/contenus/inscription/envies";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserEffacementLocal } from "~/hooks/utiliser-effacement-local";
import { utiliserModeDemo } from "~/hooks/utiliser-mode-demo";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";
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

/**
 * Réglages, ouverts depuis le profil (⚙️) : ton profil, tes notifications, ton compte privé, les personnes bloquées, les pages
 * légales, les Coulisses de la démo (en développement seulement) et de quoi tout effacer.
 */
export default function Reglages() {
  const router = useRouter();
  const { profil, avatar } = utiliserProfil();
  const communaute = utiliserCommunaute();
  const suivisPersonnes = utiliserSuivisPersonnes();
  const effacement = utiliserEffacementLocal();
  const outilsDemo = effacement.avecDemo;
  const demo = utiliserModeDemo();
  const { connecte, compte, fermer } = utiliserSession();
  if (!profil) return null;

  // Seules les envies que l'app connaît encore sont comptées
  const nombreEnvies = etapesEnvies.reduce((total, etape) => {
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

  const nombreBloques = communaute.bloques.length;
  const detailBloques = !communaute.pret
    ? "Les gens dont tu ne veux plus rien voir"
    : nombreBloques === 0
      ? "Personne pour l'instant, que des bonnes ondes"
      : `${nombreBloques} personne${nombreBloques > 1 ? "s" : ""} bloquée${nombreBloques > 1 ? "s" : ""} · tu peux changer d'avis`;

  const detailConfidentialite = !suivisPersonnes.pret
    ? "Qui peut te suivre sans demander"
    : suivisPersonnes.comptePrive
      ? "Activé : chaque abonné te demande d'abord"
      : "Désactivé : tout le monde peut te suivre";

  const version = Constants.expoConfig?.version;

  async function toutEffacer() {
    // Le téléphone oublie aussi le compte (il reste sur le serveur : on s'y reconnecte quand on veut)
    if (connecte) await fermer();
    // Sans profil, l'app repart toute seule à la bienvenue ; un échec est dit (Alert n'existe pas sur le web)
    if (!(await effacement.toutEffacer()) && Platform.OS !== "web") {
      Alert.alert("Oups, ça a coincé", "Une partie de tes données n'a pas pu être effacée. Réessaie dans un instant.");
    }
  }

  function demanderEffacement() {
    // Sur le web (aperçu de développement), Alert n'existe pas : on efface directement
    if (Platform.OS === "web") return void toutEffacer();
    Alert.alert(
      "Tout effacer et recommencer ?",
      `Ton profil, ton avatar, tes rescousses, tes lieux gardés, tes J'aime, tes abonnés et abonnements, tes notifications, tes signalements${outilsDemo ? ", tes réglages de notifications et tes visites de démo" : " et tes réglages de notifications"} vont disparaître de ce téléphone. Tu repartiras de la bienvenue, comme au premier jour.`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Tout effacer", style: "destructive", onPress: () => void toutEffacer() },
      ],
    );
  }

  return (
    <EcranReglage titre="Réglages" sousTitre="Ton profil, tes alertes et tes données : ici, c'est toi qui décides.">
      {connecte ? (
        <SectionReglages titre="Ton compte">
          <LigneReglage
            emoji="🔑"
            titre="Mon compte"
            detail={compte ? `${compte.email}${compte.emailVerifie ? "" : " · e-mail à confirmer"}` : "E-mail, mot de passe, déconnexion"}
            onPress={() => router.push("/reglages/compte")}
          />
        </SectionReglages>
      ) : null}
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

      <SectionReglages titre="Ta tranquillité">
        <LigneReglage emoji="🔒" titre="Compte privé" detail={detailConfidentialite} onPress={() => router.push("/reglages/confidentialite")} />
        <LigneReglage emoji="🚫" titre="Personnes bloquées" detail={detailBloques} onPress={() => router.push("/reglages/personnes-bloquees")} />
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
          emoji="🩺"
          titre="Santé et prévention"
          detail="L'alcool, la route, manger-bouger, et où trouver de l'aide"
          role="lien"
          onPress={() => ouvrirLien(ADRESSE_PAGE_PREVENTION)}
        />
        <LigneReglage
          emoji="💌"
          titre="Nous écrire"
          detail={`Une question, une idée, un bug\u00a0: ${ADRESSE_CONTACT}`}
          role="lien"
          onPress={() => ouvrirLien(`mailto:${ADRESSE_CONTACT}`)}
        />
      </SectionReglages>

      {demo.possible ? (
        <SectionReglages titre="Démo">
          {outilsDemo ? (
            <LigneReglage
              emoji="🎬"
              titre="Coulisses de la démo"
              detail="Jouer le lieu ou l'ambassadeur, simuler un pépin, tout remettre à zéro"
              onPress={() => router.push("/reglages/demo")}
            />
          ) : null}
          <LigneReglage
            emoji="🧪"
            titre={demo.actif ? "Quitter la démo" : "Passer en mode démo"}
            detail={
              demo.actif
                ? "L'app se relance avec les vraies données (ce que la démo a gardé est effacé)"
                : "Lieux, potes et visites d'exemple (développement seulement). Te déconnecte et efface ce téléphone"
            }
            onPress={() => void (demo.actif ? demo.sortir() : demo.entrer())}
          />
        </SectionReglages>
      ) : null}

      <SectionReglages titre="Tes données">
        <View className="flex-row gap-3 py-3">
          <Text accessibilityElementsHidden importantForAccessibility="no" className="text-base leading-5">
            🔒
          </Text>
          <Text className="flex-1 font-texte text-sm leading-5 text-gris">
            {lierPonctuation(
              connecte
                ? "Ton compte et ton profil sont gardés sur notre serveur (ton nom et ta date de naissance y sont chiffrés). Ta photo et ton régime particulier restent sur ce téléphone. Effacer ici ne touche que ce téléphone : pour supprimer ton compte, passe par « Mon compte »."
                : "Tout reste sur ce téléphone : ton profil dans son coffre-fort chiffré, ton activité, ton avatar et tes préférences dans l'app. Rien n'est envoyé à notre serveur pour l'instant. Et quand ton compte arrivera, ta photo et ton régime particulier ne partiront pas sans ton accord.",
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
