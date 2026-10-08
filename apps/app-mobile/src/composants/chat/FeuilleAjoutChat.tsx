import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Linking, Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { ChoixLieu } from "~/composants/potes/ChoixLieu";
import { retirerEmojiAnnonce } from "~/fonctions/chat/retirer-emoji-annonce";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import couleurs from "~/theme/couleurs";

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

const REGLE_MEDIAS = "Photos et vocaux, c'est entre potes du même âge : la règle qui protège les 15-17 ans. Les lieux et les emoji, eux, passent partout 😉";
const CAMERA_REFUSEE: Message = {
  texte: "L'appareil photo est fermé pour SOS Miam. Pour prendre une photo ici, ouvre-le dans les réglages de ton téléphone 📸",
  reglages: true,
};
const PHOTO_PAS_PARTIE: Message = { texte: "Ta photo n'a pas pu partir. Réessaie, ou choisis-en une autre !" };
const LIEU_INTERDIT: Message = {
  texte: "Ce lieu ne peut pas être partagé ici : pas de bar quand des 15-17 ans sont dans la conversation. Un bon resto, ça marche aussi !",
};
const surLeWeb = Platform.OS === "web";
const AUCUN: string[] = [];

/** Le « + » du chat, dans une feuille qui monte du bas : partager un lieu, une photo de ta galerie, ou en prendre une. */
export function FeuilleAjoutChat({ visible, conversationId, onFermer, onEnvoye }: Props) {
  const marges = useSafeAreaInsets();
  const { height: hauteurEcran } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const conversations = utiliserConversations();
  const { trouverPote, lieuPermisDansSortie } = utiliserCommunaute();
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

  const tous = conversations.trouverConversation(conversationId)?.participants ?? AUCUN;
  const participants = useMemo(() => tous.filter((id) => id !== ID_MOI), [tous]);
  const medias = conversations.peutEnvoyerMedias(conversationId);
  const mineurAvecToi = participants.some((id) => trouverPote(id)?.mineur);
  // Pas de bar proposé quand un mineur est dans la conversation (toi compris)
  const permis = useCallback((lieu: Lieu) => lieuPermisDansSortie(lieu.id, participants), [lieuPermisDansSortie, participants]);

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
    if (conversations.envoyerLieu(conversationId, lieuId) !== "ok") return montrer(LIEU_INTERDIT);
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
      if (envoi !== "ok") return montrer(dernieres.current.peutEnvoyerMedias(conversationId) ? PHOTO_PAS_PARTIE : { texte: REGLE_MEDIAS });
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

  const options: { cle: Option; emoji: string; titre: string; detail: string; permise: boolean }[] = [
    {
      cle: "lieu",
      emoji: "📍",
      titre: "Un lieu",
      detail: mineurAvecToi ? "Sans les bars : il y a des 15-17 ans dans la conversation" : "Ta pépite du moment, avec un « On y va ? » pour tes potes",
      permise: true,
    },
    { cle: "galerie", emoji: "🖼️", titre: "Une photo de ta galerie", detail: "Ton plat du jour, ta tête de gourmand…", permise: medias },
    // Sur le web (aperçu), il n'y a pas toujours d'appareil photo
    ...(surLeWeb ? [] : [{ cle: "camera" as const, emoji: "📸", titre: "Prendre une photo", detail: "Clic-clac, direct dans la conversation", permise: medias }]),
  ];

  return (
    <Modal visible={visible} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={onFermer}>
      <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
      <View
        accessibilityViewIsModal
        onAccessibilityEscape={onFermer}
        style={{ paddingBottom: marges.bottom + 12, maxHeight: hauteurEcran * 0.85, flexShrink: 1 }}
        className="rounded-t-3xl border-t-2 border-encre bg-creme pt-3"
      >
        <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-ligne" />
        <ScrollView contentContainerClassName="px-5">
          <Text accessibilityRole="header" className="mb-2 font-titre text-2xl text-encre">
            Partager dans la conversation
          </Text>

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
            const desactivee = !o.permise || (enCours !== null && enCours !== o.cle);
            return (
              <Pressable
                key={o.cle}
                accessibilityRole="button"
                accessibilityLabel={`${o.titre}, ${o.permise ? o.detail : "pas dans cette conversation"}`}
                accessibilityHint={o.permise ? undefined : retirerEmojiAnnonce(REGLE_MEDIAS)}
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
                  <Text className="font-texte text-sm text-gris">{lierPonctuation(o.permise ? o.detail : "Pas dans cette conversation")}</Text>
                </View>
                {enCours === o.cle ? <ActivityIndicator color={couleurs.encre} /> : <Ionicons name="chevron-forward" size={20} color={couleurs.gris} />}
              </Pressable>
            );
          })}

          {medias ? null : (
            <Text className="mt-3 font-texte text-sm leading-5 text-gris">{lierPonctuation(`🔒 ${REGLE_MEDIAS}`)}</Text>
          )}

          <Pressable accessibilityRole="button" onPress={onFermer} className="mt-4 min-h-12 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80">
            <Text className="font-texte-gras text-base text-encre">Annuler</Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Dans la feuille : la liste des lieux s'ouvre par-dessus (deux fenêtres côte à côte se gênent sur iPhone) */}
      <ChoixLieu visible={visible && choixLieu} titre="Quel lieu partager ?" permis={permis} onChoisir={choisirLieu} onFermer={() => setChoixLieu(false)} />
    </Modal>
  );
}
