import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Linking, Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ADRESSE_PAGE_PREVENTION } from "@sos-miam/commun/contenus/prevention-alcool";
import { Annonce } from "~/composants/interface/Annonce";
import { ImageAvatar } from "~/composants/profil/ImageAvatar";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { LigneReglage } from "~/composants/reglages/LigneReglage";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { SectionTesDonnees } from "~/composants/reglages/SectionTesDonnees";
import { avatarsEmoji } from "~/contenus/avatars-emoji";
import { etapesEnvies } from "~/contenus/inscription/envies";
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
 * Réglages, ouverts depuis le profil (⚙️) : ton profil, tes notifications, ta confidentialité (compte privé et « Ta bande »),
 * les personnes bloquées, les pages légales, les Coulisses de la démo (en développement seulement) et tes données : avec un
 * compte, les télécharger et voir les décisions de la modération ; et de quoi tout effacer.
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
  const marges = useSafeAreaInsets();
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const annoncer = useCallback((texte: string) => setAnnonce({ texte, numero: Date.now() }), []);
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

  // Avec un compte, l'écran règle aussi « Ta bande » (qui te trouve, ce que voit ta bande)
  const avecTaBande = suivisPersonnes.source === "compte";
  const detailConfidentialite = avecTaBande
    ? `${suivisPersonnes.pret ? (suivisPersonnes.comptePrive ? "Compte privé" : "Compte public") : "Compte privé ou public"} · qui te trouve, ce que voit ta bande`
    : !suivisPersonnes.pret
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
    <View style={{ flex: 1, backgroundColor: couleurs.creme }}>
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
          <LigneReglage
            emoji="🔒"
            titre={avecTaBande ? "Confidentialité" : "Compte privé"}
            detail={detailConfidentialite}
            onPress={() => router.push("/reglages/confidentialite")}
          />
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
            {/* En démo, pas de compte (donc pas de « Mon compte ») : la connexion par QR se regarde d'ici */}
            {demo.actif ? (
              <LigneReglage
                emoji="📷"
                titre="Connecter un appareil"
                detail="La connexion par QR code, en démo : rien ne part sur le serveur"
                onPress={() => router.push("/reglages/connecter-appareil")}
              />
            ) : null}
            <LigneReglage
              emoji="🧪"
              titre={demo.actif ? (demo.compteDeCote ? "Quitter la démo et revenir sur mon compte" : "Quitter la démo") : "Passer en mode démo"}
              detail={
                demo.actif
                  ? demo.compteDeCote
                    ? `Tu retrouves ${demo.compteDeCote} directement, sans te reconnecter (ce que la démo a gardé est effacé)`
                    : "L'app se relance avec les vraies données (ce que la démo a gardé est effacé)"
                  : "Lieux, potes et visites d'exemple (développement seulement). Ton compte est mis de côté : tu le retrouves en quittant la démo"
              }
              onPress={demo.actif ? demo.sortir : demo.entrer}
            />
          </SectionReglages>
        ) : null}

        <SectionTesDonnees connecte={connecte} onEffacer={demanderEffacement} onAnnoncer={annoncer} />

        {version ? <Text className="text-center font-texte text-xs text-gris">SOS Miam · version {version}</Text> : null}
      </EcranReglage>
      <Annonce annonce={annonce} haut={marges.top + 60} onFin={finAnnonce} />
    </View>
  );
}
