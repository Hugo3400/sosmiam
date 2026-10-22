import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Linking, Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PoigneeFeuille } from "~/composants/interface/PoigneeFeuille";
import { ChoixLieu } from "~/composants/potes/ChoixLieu";
import { retirerEmojiAnnonce } from "~/fonctions/chat/retirer-emoji-annonce";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserGlisserPourFermer } from "~/hooks/utiliser-glisser-pour-fermer";
import { utiliserInscriptionFeuille } from "~/hooks/utiliser-inscription-feuille";

type Props = {
  visible: boolean;
  conversationId: string;
  onFermer: () => void;
  /** Un lieu ou une photo est parti (la feuille se ferme d'elle-même) */
  onEnvoye: () => void;
};

type Option = "lieu" | "galerie" | "camera";
type Message = { texte: string; reglages?: boolean };

// Une photo nette mais légère, telle que tu l'as choisie (pas de recadrage imposé)
const OPTIONS_PHOTO: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.7 };
// Le temps que la liste des lieux redescende avant de fermer la feuille (deux fenêtres qui se ferment ensemble, l'iPhone n'aime pas)
const APRES_CHOIX_LIEU = 350;

const CAMERA_REFUSEE: Message = {
  texte: "L'appareil photo est fermé pour SOS Miam. Pour prendre une photo ici, ouvre-le dans les réglages de ton téléphone 📸",
  reglages: true,
};
const PHOTO_PAS_PARTIE: Message = { texte: "Ta photo n'a pas pu partir. Réessaie, ou choisis-en une autre !" };
const LIEU_PAS_PARTI: Message = { texte: "Ce lieu n'a pas pu partir. Réessaie dans un instant, ou choisis-en un autre !" };
const surLeWeb = Platform.OS === "web";

/** Le « + » du chat, dans une feuille qui monte du bas : partager un lieu, une photo de ta galerie, ou en prendre une. */
export function FeuilleAjoutChat({ visible, conversationId, onFermer, onEnvoye }: Props) {
  const couleurs = utiliserCouleurs();
  const marges = useSafeAreaInsets();
  utiliserInscriptionFeuille(visible, onFermer);
  const geste = utiliserGlisserPourFermer(visible, onFermer);
  const { height: hauteurEcran } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const conversations = utiliserConversations();
  const [choixLieu, setChoixLieu] = useState(false);
  const [enCours, setEnCours] = useState<Option | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  // Une seule ouverture du sélecteur à la fois (deux appuis rapides n'ouvrent pas deux fois l'appareil photo)
  const occupe = useRef(false);
  const fermeture = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Les dernières fonctions du chat, pour l'envoi qui suit le choix d'une photo
  const dernieres = useRef(conversations);
  dernieres.current = conversations;

  // À chaque ouverture, on repart d'une feuille propre
  const [ouverte, setOuverte] = useState(visible);
  if (visible !== ouverte) {
    setOuverte(visible);
    if (visible) {
      setMessage(null);
      setChoixLieu(false);
    }
  }

  useEffect(
    () => () => {
      if (fermeture.current) clearTimeout(fermeture.current);
    },
    [],
  );

  function montrer(nouveau: Message) {
    setMessage(nouveau);
    AccessibilityInfo.announceForAccessibility(retirerEmojiAnnonce(nouveau.texte));
  }

  function reussir() {
    setMessage(null);
    onEnvoye();
  }

  function choisirLieu(lieuId: number) {
    setChoixLieu(false);
    if (conversations.envoyerLieu(conversationId, lieuId) !== "ok") return montrer(LIEU_PAS_PARTI);
    reussir();
    fermeture.current = setTimeout(onFermer, APRES_CHOIX_LIEU);
  }

  async function choisirPhoto(source: "galerie" | "camera") {
    if (occupe.current) return;
    occupe.current = true;
    setEnCours(source);
    setMessage(null);
    try {
      let resultat: ImagePicker.ImagePickerResult;
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return montrer(CAMERA_REFUSEE);
        resultat = await ImagePicker.launchCameraAsync(OPTIONS_PHOTO);
      } else {
        // Le sélecteur de photos du système ne demande pas d'autorisation : tu ne partages que la photo choisie
        resultat = await ImagePicker.launchImageLibraryAsync(OPTIONS_PHOTO);
      }
      // Annulé : rien ne part, la feuille reste là
      if (resultat.canceled || resultat.assets.length === 0) return;
      const envoi = await dernieres.current.envoyerPhoto(conversationId, resultat.assets[0].uri);
      if (envoi !== "ok") return montrer(PHOTO_PAS_PARTIE);
      reussir();
      onFermer();
    } catch {
      montrer(
        source === "camera"
          ? { texte: "Impossible d'ouvrir l'appareil photo. Réessaie, ou pioche dans ta galerie !" }
          : { texte: "Ta galerie n'a pas voulu s'ouvrir. Vérifie dans les réglages de ton téléphone que SOS Miam peut voir tes photos.", reglages: true },
      );
    } finally {
      occupe.current = false;
      setEnCours(null);
    }
  }

  function ouvrirReglages() {
    Linking.openSettings().catch(() => montrer({ texte: "Les réglages n'ont pas voulu s'ouvrir. Tu les trouveras dans l'appli Réglages de ton téléphone." }));
  }

  const options: { cle: Option; emoji: string; titre: string; detail: string }[] = [
    { cle: "lieu", emoji: "📍", titre: "Un lieu", detail: "Ta pépite du moment, avec un « On y va ? » pour tes potes" },
    { cle: "galerie", emoji: "🖼️", titre: "Une photo de ta galerie", detail: "Ton plat du jour, ta tête de gourmand…" },
    // Sur le web (aperçu), il n'y a pas toujours d'appareil photo
    ...(surLeWeb ? [] : [{ cle: "camera" as const, emoji: "📸", titre: "Prendre une photo", detail: "Clic-clac, direct dans la conversation" }]),
  ];

  return (
    <Modal visible={visible} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={onFermer}>
      <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
      <Animated.View
        accessibilityViewIsModal
        onAccessibilityEscape={onFermer}
        onLayout={geste.mesurerFeuille}
        style={[{ maxHeight: hauteurEcran * 0.85, flexShrink: 1 }, geste.styleFeuille]}
      >
        <View style={{ paddingBottom: marges.bottom + 12, flexShrink: 1 }} className="rounded-t-3xl border-t-2 border-encre bg-creme">
          <PoigneeFeuille geste={geste} className="px-5">
            <Text accessibilityRole="header" className="mb-2 font-titre text-2xl text-encre">
              Partager dans la conversation
            </Text>
          </PoigneeFeuille>
          <ScrollView contentContainerClassName="px-5">

            {message ? (
              <View className="mb-2 gap-2 rounded-2xl border-2 border-rouge-texte bg-rose-alerte px-3.5 py-2.5">
                <Text className="font-texte-semi text-[15px] leading-[21px] text-rouge-texte">{lierPonctuation(message.texte)}</Text>
                {message.reglages && !surLeWeb ? (
                  <Pressable accessibilityRole="link" onPress={ouvrirReglages} hitSlop={8} className="min-h-8 justify-center self-start active:opacity-70">
                    <Text className="font-texte-gras text-[15px] text-encre underline">Ouvrir les réglages</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {options.map((o) => {
              const desactivee = enCours !== null && enCours !== o.cle;
              return (
                <Pressable
                  key={o.cle}
                  accessibilityRole="button"
                  accessibilityLabel={`${o.titre}, ${o.detail}`}
                  accessibilityState={{ disabled: desactivee }}
                  disabled={desactivee || enCours === o.cle}
                  onPress={() => {
                    vibrerLegerement();
                    if (o.cle === "lieu") {
                      setMessage(null);
                      setChoixLieu(true);
                    } else void choisirPhoto(o.cle);
                  }}
                  className={`min-h-14 flex-row items-center gap-4 border-b border-ligne py-3 active:opacity-70 ${desactivee ? "opacity-40" : ""}`}
                >
                  <Text className="text-2xl">{o.emoji}</Text>
                  <View className="flex-1">
                    <Text className="font-texte-gras text-base text-encre">{o.titre}</Text>
                    <Text className="font-texte text-sm text-gris">{lierPonctuation(o.detail)}</Text>
                  </View>
                  {enCours === o.cle ? <ActivityIndicator color={couleurs.encre} /> : <Ionicons name="chevron-forward" size={20} color={couleurs.gris} />}
                </Pressable>
              );
            })}

            <Pressable accessibilityRole="button" onPress={onFermer} className="mt-4 min-h-12 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80">
              <Text className="font-texte-gras text-base text-encre">Annuler</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Animated.View>

      {/* Dans la feuille : la liste des lieux s'ouvre par-dessus (deux fenêtres côte à côte se gênent sur iPhone) */}
      <ChoixLieu visible={visible && choixLieu} titre="Quel lieu partager ?" onChoisir={choisirLieu} onFermer={() => setChoixLieu(false)} />
    </Modal>
  );
}
