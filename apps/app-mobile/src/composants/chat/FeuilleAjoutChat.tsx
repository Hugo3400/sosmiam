import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Linking, Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MAX_PHOTOS_ALBUM } from "@sos-miam/commun/regles/chat";
import { EnvoiPhotosChat } from "~/composants/chat/EnvoiPhotosChat";
import { FeuilleGifChat } from "~/composants/chat/FeuilleGifChat";
import { PoigneeFeuille } from "~/composants/interface/PoigneeFeuille";
import { ChoixLieu } from "~/composants/potes/ChoixLieu";
import { TEXTES_CHAT_CHAMP_PAR_LANGUE } from "~/contenus/textes-chat-champ";
import { TEXTES_MEDIAS_CHAT_PAR_LANGUE } from "~/contenus/textes-medias-chat";
import { nommerGroupe } from "~/fonctions/chat/nommer-groupe";
import { retirerEmojiAnnonce } from "~/fonctions/chat/retirer-emoji-annonce";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserGlisserPourFermer } from "~/hooks/utiliser-glisser-pour-fermer";
import { utiliserInscriptionFeuille } from "~/hooks/utiliser-inscription-feuille";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  visible: boolean;
  conversationId: string;
  onFermer: () => void;
  /** Un lieu ou une photo est parti (la feuille se ferme d'elle-même) */
  onEnvoye: () => void;
};

type Option = "galerie" | "camera" | "lieu" | "gif" | "sondage";
type Message = { texte: string; reglages?: boolean };

// Une photo nette mais légère, telle que tu l'as choisie (pas de recadrage imposé)
const OPTIONS_PHOTO: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.7 };
const OPTIONS_GALERIE: ImagePicker.ImagePickerOptions = { ...OPTIONS_PHOTO, allowsMultipleSelection: true, selectionLimit: MAX_PHOTOS_ALBUM, orderedSelection: true };
const ICONES: Record<Option, keyof typeof Ionicons.glyphMap> = { galerie: "images-outline", camera: "camera-outline", lieu: "location-outline", gif: "film-outline", sondage: "bar-chart-outline" };
// Le temps que la liste des lieux redescende avant de fermer la feuille (deux fenêtres qui se ferment ensemble, l'iPhone n'aime pas)
const APRES_CHOIX_LIEU = 350;

const surLeWeb = Platform.OS === "web";

/**
 * Le « + » du chat, dans une feuille qui monte du bas : des photos de ta galerie (avec un petit mot, EnvoiPhotosChat), en
 * prendre une, un lieu, un GIF (FeuilleGifChat), et dans un groupe le sondage « On mange où ? ».
 */
export function FeuilleAjoutChat({ visible, conversationId, onFermer, onEnvoye }: Props) {
  const couleurs = utiliserCouleurs();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_MEDIAS_CHAT_PAR_LANGUE);
  const T_CHAMP = utiliserTextes(TEXTES_CHAT_CHAMP_PAR_LANGUE);
  const router = useRouter();
  const monId = utiliserMonId();
  const { trouverPote } = utiliserCommunaute();
  const marges = useSafeAreaInsets();
  utiliserInscriptionFeuille(visible, onFermer);
  const geste = utiliserGlisserPourFermer(visible, onFermer);
  const { height: hauteurEcran } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const conversations = utiliserConversations();
  const [choixLieu, setChoixLieu] = useState(false);
  const [choixGif, setChoixGif] = useState(false);
  const [photos, setPhotos] = useState<string[] | null>(null);
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
      setChoixGif(false);
      setPhotos(null);
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
    if (conversations.envoyerLieu(conversationId, lieuId) !== "ok") return montrer({ texte: T_CHAMP.lieuPasParti });
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
        if (!permission.granted) return montrer({ texte: T_CHAMP.cameraRefusee, reglages: true });
        resultat = await ImagePicker.launchCameraAsync(OPTIONS_PHOTO);
      } else {
        // Le sélecteur de photos du système ne demande pas d'autorisation : tu ne partages que les photos choisies
        resultat = await ImagePicker.launchImageLibraryAsync(OPTIONS_GALERIE);
      }
      // Annulé : rien ne part, la feuille reste là
      if (resultat.canceled || resultat.assets.length === 0) return;
      // Galerie : avant d'envoyer, un coup d'œil et un petit mot (EnvoiPhotosChat)
      if (source === "galerie") return setPhotos(resultat.assets.map((a) => a.uri));
      const envoi = await dernieres.current.envoyerPhotos(conversationId, [resultat.assets[0].uri]);
      if (envoi !== "ok") return montrer({ texte: T_CHAMP.photoPasPartie });
      reussir();
      onFermer();
    } catch {
      montrer(
        source === "camera"
          ? { texte: T_CHAMP.cameraImpossible }
          : { texte: T_CHAMP.galerieFermee, reglages: true },
      );
    } finally {
      occupe.current = false;
      setEnCours(null);
    }
  }

  function ouvrirReglages() {
    Linking.openSettings().catch(() => montrer({ texte: T_CHAMP.reglagesFermes }));
  }

  const conversation = conversations.trouverConversation(conversationId);
  const groupe = conversation?.type === "groupe";
  const pote = groupe ? null : trouverPote(conversation?.participants.find((p) => p !== monId) ?? "");
  const nom = groupe ? nommerGroupe(conversation?.titre, langue) : (pote?.prenom ?? T_CHAMP.tonPote);
  const options: { cle: Option; titre: string; detail: string; nouveau?: boolean }[] = [
    { cle: "galerie", titre: T.photos, detail: T.photosDetail },
    // Sur le web (aperçu), il n'y a pas toujours d'appareil photo
    ...(surLeWeb ? [] : [{ cle: "camera" as const, titre: T.camera, detail: T.cameraDetail }]),
    { cle: "lieu", titre: T.lieu, detail: T.lieuDetail },
    { cle: "gif", titre: T.gif, detail: T.gifDetail },
    ...(groupe ? [{ cle: "sondage" as const, titre: T.sondage, detail: T.sondageDetail, nouveau: true }] : []),
  ];

  function choisir(cle: Option) {
    setMessage(null);
    if (cle === "lieu") return setChoixLieu(true);
    if (cle === "gif") return setChoixGif(true);
    if (cle === "sondage") {
      onFermer();
      router.push({ pathname: "/potes/sondage/[id]", params: { id: conversationId } });
      return;
    }
    void choisirPhoto(cle);
  }

  return (
    <Modal visible={visible} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={onFermer}>
      <Pressable accessibilityRole="button" accessibilityLabel={T_CHAMP.fermer} onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
      <Animated.View
        accessibilityViewIsModal
        onAccessibilityEscape={onFermer}
        onLayout={geste.mesurerFeuille}
        style={[{ maxHeight: hauteurEcran * 0.85, flexShrink: 1 }, geste.styleFeuille]}
      >
        <View style={{ paddingBottom: marges.bottom + 12, flexShrink: 1 }} className="rounded-t-3xl border-t-2 border-encre bg-creme">
          <PoigneeFeuille geste={geste} className="px-5">
            <Text accessibilityRole="header" numberOfLines={2} className="mb-2 font-titre text-2xl text-encre">
              {T.titreFeuille(groupe ? T_CHAMP.dansGroupe(nom) : T_CHAMP.aPote(nom))}
            </Text>
          </PoigneeFeuille>
          <ScrollView contentContainerClassName="px-5">

            {message ? (
              <View className="mb-2 gap-2 rounded-2xl border-2 border-rouge-texte bg-rose-alerte px-3.5 py-2.5">
                <Text className="font-texte-semi text-[15px] leading-[21px] text-rouge-texte">{lierPonctuation(message.texte)}</Text>
                {message.reglages && !surLeWeb ? (
                  <Pressable accessibilityRole="link" onPress={ouvrirReglages} hitSlop={8} className="min-h-8 justify-center self-start active:opacity-70">
                    <Text className="font-texte-gras text-[15px] text-encre underline">{T_CHAMP.ouvrirReglages}</Text>
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
                  accessibilityLabel={`${o.titre}${o.nouveau ? `, ${T.nouveau}` : ""}, ${o.detail}`}
                  accessibilityState={{ disabled: desactivee }}
                  disabled={desactivee || enCours === o.cle}
                  onPress={() => {
                    vibrerLegerement();
                    choisir(o.cle);
                  }}
                  className={`min-h-16 flex-row items-center gap-3.5 border-b border-ligne py-2.5 active:opacity-70 ${desactivee ? "opacity-40" : ""}`}
                >
                  <View className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-jaune">
                    {enCours === o.cle ? <ActivityIndicator color={couleurs.nuit} /> : <Ionicons name={ICONES[o.cle]} size={20} color={couleurs.nuit} />}
                  </View>
                  <View className="flex-1 gap-0.5">
                    <View className="flex-row items-center gap-2">
                      <Text className="font-texte-gras text-base text-encre">{lierPonctuation(o.titre)}</Text>
                      {o.nouveau ? (
                        <View className="rounded-full border border-encre bg-nuit px-2 py-px">
                          <Text className="font-texte-gras text-[11px] text-jaune">{T.nouveau}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text className="font-texte text-sm text-gris">{lierPonctuation(o.detail)}</Text>
                  </View>
                </Pressable>
              );
            })}

            <Pressable accessibilityRole="button" onPress={onFermer} className="mt-4 min-h-12 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80">
              <Text className="font-texte-gras text-base text-encre">{T_CHAMP.annuler}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Animated.View>

      {/* Dans la feuille : la liste des lieux, les GIF et l'aperçu des photos s'ouvrent par-dessus (deux fenêtres côte à côte se gênent sur iPhone) */}
      <ChoixLieu visible={visible && choixLieu} titre={T_CHAMP.quelLieu} onChoisir={choisirLieu} onFermer={() => setChoixLieu(false)} />
      <FeuilleGifChat
        visible={visible && choixGif}
        conversationId={conversationId}
        onFermer={() => setChoixGif(false)}
        onEnvoye={() => {
          setChoixGif(false);
          reussir();
          fermeture.current = setTimeout(onFermer, APRES_CHOIX_LIEU);
        }}
      />
      <EnvoiPhotosChat
        visible={visible && photos !== null}
        conversationId={conversationId}
        nom={nom}
        photosDepart={photos ?? []}
        onFermer={() => setPhotos(null)}
        onEnvoye={() => {
          setPhotos(null);
          reussir();
          fermeture.current = setTimeout(onFermer, APRES_CHOIX_LIEU);
        }}
      />
    </Modal>
  );
}
