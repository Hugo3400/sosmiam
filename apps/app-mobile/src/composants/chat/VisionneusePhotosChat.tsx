import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { FlatList, Modal, Pressable, ScrollView, Text, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import Animated, { FadeOut, ZoomIn, useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PagePhotoVisionneuse, type PoigneePagePhoto } from "~/composants/chat/PagePhotoVisionneuse";
import { TEXTES_MEDIAS_CHAT as T } from "~/contenus/textes-medias-chat";
import { TEXTES_MESSAGES as T_MESSAGES } from "~/contenus/textes-messages";
import type { MessageChatEnrichi } from "~/contenus/type-discussion-chat";
import { lireSourcePhotoChat } from "~/fonctions/chat/lire-source-photo-chat";
import { formaterIlYA } from "~/fonctions/dates/formater-il-y-a";
import { vibrerJaime } from "~/fonctions/interaction/vibrer-jaime";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserMediaChat } from "~/hooks/utiliser-media-chat";

type Props = {
  visible: boolean;
  conversationId: string;
  photos: MessageChatEnrichi[];
  depart: number;
  prenomDe: (message: MessageChatEnrichi) => string;
  onFermer: () => void;
  onDoubleAppui: (message: MessageChatEnrichi) => boolean;
};

const DELAI_DOUBLE_APPUI = 300;
const TAILLE_VIGNETTE = 48;
const HAUT_ENTETE = 68;
const BAS_PIED = 112;

function Vignette({ conversationId, message, choisie, numero, total, onPress }: { conversationId: string; message: MessageChatEnrichi; choisie: boolean; numero: number; total: number; onPress: () => void }) {
  const media = utiliserMediaChat(conversationId, message);
  const source = media.fichier ? lireSourcePhotoChat(media.fichier) : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={T.voirPhoto(numero, total)}
      accessibilityState={{ selected: choisie }}
      onPress={onPress}
      style={{ width: TAILLE_VIGNETTE, height: TAILLE_VIGNETTE }}
      className={`overflow-hidden rounded-lg border-2 bg-trait-nuit active:opacity-80 ${choisie ? "border-jaune" : "border-transparent"}`}
    >
      {source ? <Image source={source} contentFit="cover" style={{ flex: 1 }} /> : null}
    </Pressable>
  );
}

export function VisionneusePhotosChat({ visible, conversationId, photos, depart, prenomDe, onFermer, onDoubleAppui }: Props) {
  const couleurs = utiliserCouleurs();
  const marges = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const liste = useRef<FlatList<MessageChatEnrichi>>(null);
  const pages = useRef(new Map<string, PoigneePagePhoto>());
  const [index, setIndex] = useState(Math.min(depart, Math.max(0, photos.length - 1)));
  const [zoome, setZoome] = useState(false);
  const [coeur, setCoeur] = useState<number | null>(null);
  const dernierAppui = useRef(0);
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ouverte, setOuverte] = useState(visible);
  if (visible !== ouverte) {
    setOuverte(visible);
    if (visible) {
      setIndex(Math.min(depart, Math.max(0, photos.length - 1)));
      setZoome(false);
    }
  }

  useEffect(
    () => () => {
      if (minuterie.current) clearTimeout(minuterie.current);
    },
    [],
  );

  const total = photos.length;
  const courante = photos[Math.min(index, total - 1)];
  const hauteurPage = Math.max(200, height - marges.top - marges.bottom - HAUT_ENTETE - (total > 1 ? BAS_PIED : BAS_PIED - TAILLE_VIGNETTE));

  function appui(message: MessageChatEnrichi) {
    const maintenant = Date.now();
    if (maintenant - dernierAppui.current >= DELAI_DOUBLE_APPUI) {
      dernierAppui.current = maintenant;
      return;
    }
    dernierAppui.current = 0;
    vibrerJaime();
    if (!onDoubleAppui(message) || animationsReduites) return;
    setCoeur(maintenant);
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = setTimeout(() => setCoeur(null), 700);
  }

  function aller(vers: number) {
    if (vers === index) return;
    pages.current.get(photos[index]?.id ?? "")?.remettre();
    setZoome(false);
    setIndex(vers);
    liste.current?.scrollToIndex({ index: vers, animated: !animationsReduites });
  }

  function suivreFinDefilement(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const vers = Math.round(e.nativeEvent.contentOffset.x / width);
    if (vers === index || vers < 0 || vers >= total) return;
    pages.current.get(photos[index]?.id ?? "")?.remettre();
    setZoome(false);
    setIndex(vers);
  }

  if (!courante) return null;
  const moment = formaterIlYA(courante.date).court;
  const libelle = `${T.voirPhoto(index + 1, total)}, ${prenomDe(courante)}, ${moment}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFermer} statusBarTranslucent>
      <View accessibilityViewIsModal onAccessibilityEscape={onFermer} style={{ paddingTop: marges.top, paddingBottom: marges.bottom }} className="flex-1 bg-nuit">
        <View style={{ height: HAUT_ENTETE }} className="flex-row items-center gap-2.5 px-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={T.fermerPhoto}
            hitSlop={8}
            onPress={onFermer}
            className="h-11 w-11 items-center justify-center rounded-full border-2 border-lait active:opacity-70"
          >
            <Ionicons name="close" size={22} color={couleurs.lait} />
          </Pressable>
          <View accessible accessibilityLiveRegion="polite" accessibilityLabel={`${T.surN(index + 1, total)}, ${prenomDe(courante)}, ${moment}`} className="flex-1 items-center">
            <Text className="font-texte-gras text-base text-lait">{T.surN(index + 1, total)}</Text>
            <Text numberOfLines={1} className="font-texte text-[13px] text-gris-nuit">{`${prenomDe(courante)} · ${moment}`}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={zoome ? T.dezoomer : T.zoomer}
            hitSlop={8}
            onPress={() => {
              vibrerLegerement();
              pages.current.get(courante.id)?.basculerZoom();
              setZoome((z) => !z);
            }}
            className="h-11 w-11 items-center justify-center rounded-full border-2 border-lait active:opacity-70"
          >
            <Ionicons name={zoome ? "contract-outline" : "expand-outline"} size={20} color={couleurs.lait} />
          </Pressable>
        </View>

        <FlatList
          ref={liste}
          data={photos}
          keyExtractor={(m) => m.id}
          horizontal
          pagingEnabled
          scrollEnabled={!zoome && total > 1}
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={Math.min(depart, Math.max(0, total - 1))}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={suivreFinDefilement}
          renderItem={({ item, index: i }) => (
            <PagePhotoVisionneuse
              ref={(poignee) => {
                if (poignee) pages.current.set(item.id, poignee);
                else pages.current.delete(item.id);
              }}
              conversationId={conversationId}
              message={item}
              largeur={width}
              hauteur={hauteurPage}
              libelle={i === index ? libelle : T.voirPhoto(i + 1, total)}
              onAppui={() => appui(item)}
              onZoom={setZoome}
            />
          )}
          style={{ flexGrow: 0, height: hauteurPage }}
        />

        <View className="flex-1 justify-end gap-3 px-4 pb-4">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-center font-texte text-[13px] text-gris-nuit">
            {lierPonctuation(total > 1 ? T.astuceAlbum : `${T.astucePhoto} ${T_MESSAGES.emojiDoubleToucher}`)}
          </Text>
          {total > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="grow justify-center gap-1.5">
              {photos.map((m, i) => (
                <Vignette key={m.id} conversationId={conversationId} message={m} choisie={i === index} numero={i + 1} total={total} onPress={() => aller(i)} />
              ))}
            </ScrollView>
          ) : null}
        </View>

        {coeur !== null ? (
          <View pointerEvents="none" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" }}>
            <Animated.View key={coeur} entering={ZoomIn.springify().damping(12)} exiting={FadeOut.duration(250)}>
              <Text allowFontScaling={false} style={{ fontSize: 96 }}>
                {T_MESSAGES.emojiDoubleToucher}
              </Text>
            </Animated.View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
