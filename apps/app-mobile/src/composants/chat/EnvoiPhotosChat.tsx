import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MAX_PHOTOS_ALBUM } from "@sos-miam/commun/regles/chat";
import { LONGUEUR_MAX_MESSAGE } from "@sos-miam/commun/regles/potes";
import { TEXTES_MEDIAS_CHAT_PAR_LANGUE } from "~/contenus/textes-medias-chat";
import { retirerEmojiAnnonce } from "~/fonctions/chat/retirer-emoji-annonce";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserConversations, type ResultatEnvoiChat } from "~/hooks/utiliser-conversations";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  visible: boolean;
  conversationId: string;
  nom: string;
  photosDepart: string[];
  onEnvoye: () => void;
  onFermer: () => void;
};

const TAILLE_VIGNETTE = 60;

export function EnvoiPhotosChat({ visible, conversationId, nom, photosDepart, onEnvoye, onFermer }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_MEDIAS_CHAT_PAR_LANGUE);
  const refus: Partial<Record<ResultatEnvoiChat, string>> = {
    "trop-long": T.petitMotTropLong,
    "mot-interdit": T.petitMotRefuse,
  };
  const marges = useSafeAreaInsets();
  const animationsReduites = useReducedMotion();
  const { envoyerPhotos } = utiliserConversations();
  const [photos, setPhotos] = useState<string[]>(photosDepart);
  const [choisie, setChoisie] = useState(0);
  const [mot, setMot] = useState("");
  const [souci, setSouci] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const occupe = useRef(false);
  const [ouverte, setOuverte] = useState(visible);
  if (visible !== ouverte) {
    setOuverte(visible);
    if (visible) {
      setPhotos(photosDepart.slice(0, MAX_PHOTOS_ALBUM));
      setChoisie(0);
      setMot("");
      setSouci(null);
      setEnvoi(false);
    }
  }

  const n = photos.length;
  const courante = photos[Math.min(choisie, n - 1)];

  function dire(texte: string) {
    setSouci(texte);
    AccessibilityInfo.announceForAccessibility(retirerEmojiAnnonce(texte));
  }

  function retirer(i: number) {
    vibrerLegerement();
    const restantes = photos.filter((_, j) => j !== i);
    if (restantes.length === 0) return onFermer();
    setPhotos(restantes);
    setChoisie((c) => Math.min(c > i ? c - 1 : c, restantes.length - 1));
  }

  async function ajouter() {
    if (occupe.current || n >= MAX_PHOTOS_ALBUM) return dire(T.albumPlein);
    occupe.current = true;
    try {
      const resultat = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        allowsMultipleSelection: true,
        selectionLimit: MAX_PHOTOS_ALBUM - n,
        orderedSelection: true,
      });
      if (resultat.canceled || resultat.assets.length === 0) return;
      const ajoutees = resultat.assets.map((a) => a.uri);
      const toutes = [...photos, ...ajoutees].slice(0, MAX_PHOTOS_ALBUM);
      if (photos.length + ajoutees.length > MAX_PHOTOS_ALBUM) dire(T.albumPlein);
      setPhotos(toutes);
      setChoisie(photos.length);
    } catch {
      dire(T.photosPasParties);
    } finally {
      occupe.current = false;
    }
  }

  async function envoyer() {
    if (envoi || n === 0) return;
    setEnvoi(true);
    setSouci(null);
    const resultat = await envoyerPhotos(conversationId, photos, mot);
    setEnvoi(false);
    if (resultat === "ok") {
      vibrerLegerement();
      return onEnvoye();
    }
    dire(refus[resultat] ?? T.photosPasParties);
  }

  return (
    <Modal visible={visible} animationType={animationsReduites ? "fade" : "slide"} onRequestClose={onFermer} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View accessibilityViewIsModal onAccessibilityEscape={onFermer} style={{ flex: 1, paddingTop: marges.top + 8, paddingBottom: marges.bottom + 8 }} className="bg-creme">
          <View className="flex-row items-center gap-2.5 px-4 pb-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={T.annulerEnvoi}
              hitSlop={8}
              onPress={onFermer}
              className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
            >
              <Ionicons name="close" size={20} color={couleurs.encre} />
            </Pressable>
            <View className="flex-1">
              <Text accessibilityRole="header" numberOfLines={1} className="font-titre text-[19px] leading-6 text-encre">
                {T.pour(nom)}
              </Text>
              <Text className="font-texte text-[13px] text-gris">{T.nombrePhotos(n)}</Text>
            </View>
          </View>

          <View className="flex-1 px-4">
            <View className="flex-1 overflow-hidden rounded-[20px] border-2 border-encre bg-ligne">
              {courante ? <Image source={{ uri: courante }} contentFit="contain" accessible accessibilityLabel={T.voirPhoto(choisie + 1, n)} style={{ flex: 1 }} /> : null}
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ flexGrow: 0 }} contentContainerClassName="gap-3 px-4 pb-1 pt-4">
            {photos.map((uri, i) => (
              <View key={`${uri}-${i}`} style={{ width: TAILLE_VIGNETTE, height: TAILLE_VIGNETTE }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={T.voirPhoto(i + 1, n)}
                  accessibilityState={{ selected: i === choisie }}
                  onPress={() => setChoisie(i)}
                  style={{ width: TAILLE_VIGNETTE, height: TAILLE_VIGNETTE }}
                  className={`overflow-hidden rounded-[10px] border-2 bg-ligne active:opacity-80 ${i === choisie ? "border-encre" : "border-ligne"}`}
                >
                  <Image source={{ uri }} contentFit="cover" style={{ flex: 1 }} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={T.retirerPhoto(i + 1)}
                  hitSlop={10}
                  onPress={() => retirer(i)}
                  style={{ position: "absolute", top: -8, right: -8 }}
                  className="h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-creme bg-encre active:opacity-80"
                >
                  <Ionicons name="close" size={12} color={couleurs.creme} />
                </Pressable>
              </View>
            ))}
            {n < MAX_PHOTOS_ALBUM ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={T.ajouterPhotos}
                accessibilityHint={T.ajouterPhotosIndice(MAX_PHOTOS_ALBUM - n)}
                onPress={() => void ajouter()}
                style={{ width: TAILLE_VIGNETTE, height: TAILLE_VIGNETTE }}
                className="items-center justify-center rounded-[10px] border-2 border-dashed border-gris active:opacity-70"
              >
                <Ionicons name="add" size={24} color={couleurs.encre} />
              </Pressable>
            ) : null}
          </ScrollView>

          <View className="gap-1.5 px-4 pt-3">
            {souci ? <Text className="font-texte-semi text-sm leading-5 text-rouge-texte">{lierPonctuation(souci)}</Text> : null}
            <View className="flex-row items-end gap-2">
              <TextInput
                accessibilityLabel={T.petitMotLu}
                value={mot}
                onChangeText={(texte) => {
                  setMot(texte);
                  if (souci) setSouci(null);
                }}
                placeholder={T.petitMot}
                placeholderTextColor={couleurs.gris}
                selectionColor={couleurs.encre}
                cursorColor={couleurs.encre}
                maxLength={LONGUEUR_MAX_MESSAGE}
                multiline
                className="max-h-28 min-h-[56px] flex-1 rounded-[22px] border-2 border-encre bg-carte px-4 py-2.5 font-texte text-base text-encre"
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={T.envoyerPhotos(n)}
                accessibilityState={{ busy: envoi, disabled: envoi }}
                disabled={envoi}
                onPress={() => void envoyer()}
                className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-jaune active:opacity-80"
              >
                {envoi ? <ActivityIndicator size="small" color={couleurs.nuit} /> : <Ionicons name="arrow-up" size={22} color={couleurs.nuit} />}
              </Pressable>
            </View>
            <Text className="pl-1.5 font-texte text-[13px] text-gris">{lierPonctuation(T.petitMotAide)}</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
