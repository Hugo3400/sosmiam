import { Image } from "expo-image";
import { useState } from "react";
import { Keyboard, Pressable, Text, useWindowDimensions, View, type PressableProps } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import { VisionneusePhotosChat } from "~/composants/chat/VisionneusePhotosChat";
import { TEXTES_MEDIAS_CHAT as T } from "~/contenus/textes-medias-chat";
import type { MessageChatEnrichi } from "~/contenus/type-discussion-chat";
import { lireSourcePhotoChat } from "~/fonctions/chat/lire-source-photo-chat";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserMediaChat } from "~/hooks/utiliser-media-chat";

type Props = {
  conversationId: string;
  photos: MessageChatEnrichi[];
  legende: string | undefined;
  deMoi: boolean;
  prenom: string;
  libelle: string;
  onAppuiLong: () => void;
  onAppuiTexte: () => void;
  onDoubleAppui: (message: MessageChatEnrichi) => boolean;
  actionsLecteur?: Pick<PressableProps, "accessibilityActions" | "onAccessibilityAction">;
};

const ECART = 4;
const TUILES_MAX = 4;
const ETATS_CACHES = new Set(["supprime", "masque", "retire", "illisible"]);

function TuileAlbum({ conversationId, message, largeur, hauteur, plus, libelle, onPress, onLongPress, actionsLecteur }: {
  conversationId: string;
  message: MessageChatEnrichi;
  largeur: number;
  hauteur: number;
  plus: number;
  libelle: string;
  onPress: () => void;
  onLongPress: () => void;
  actionsLecteur?: Props["actionsLecteur"];
}) {
  const animationsReduites = useReducedMotion();
  const media = utiliserMediaChat(conversationId, message);
  const source = media.fichier ? lireSourcePhotoChat(media.fichier) : null;
  return (
    <Pressable
      accessibilityRole="imagebutton"
      accessibilityLabel={plus > 0 ? `${libelle}, ${T.plusDePhotos(plus)}` : libelle}
      accessibilityHint="Ouvre les photos en grand"
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      {...actionsLecteur}
      style={{ width: largeur, height: hauteur }}
      className="items-center justify-center overflow-hidden rounded-lg bg-ligne active:opacity-80"
    >
      {source ? (
        <Image source={source} contentFit="cover" transition={animationsReduites ? 0 : 150} style={{ width: largeur, height: hauteur }} />
      ) : (
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-2xl">
          {media.etat === "expire" ? "⌛" : "📷"}
        </Text>
      )}
      {plus > 0 ? (
        <View pointerEvents="none" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} className="items-center justify-center bg-nuit/55">
          <Text allowFontScaling={false} className="font-titre text-2xl text-lait">{`+${plus}`}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function AlbumChat({ conversationId, photos, legende, deMoi, prenom, libelle, onAppuiLong, onAppuiTexte, onDoubleAppui, actionsLecteur }: Props) {
  const { width } = useWindowDimensions();
  const [ouverte, setOuverte] = useState<number | null>(null);
  const visibles = photos.filter((m) => !(m.etat && ETATS_CACHES.has(m.etat)));
  const largeur = Math.min(240, Math.round(width * 0.62));
  const interieur = largeur - 2 * ECART - 4;
  const moitie = (interieur - ECART) / 2;
  const coins = deMoi ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-tl-md";
  const n = visibles.length;
  const montrees = visibles.slice(0, TUILES_MAX);

  const taille = (i: number) => {
    if (n === 1) return { largeur: interieur, hauteur: Math.round(interieur * 1.1) };
    if (n === 2) return { largeur: moitie, hauteur: Math.round(moitie * 1.25) };
    if (n === 3 && i === 2) return { largeur: interieur, hauteur: Math.round(moitie * 0.9) };
    return { largeur: moitie, hauteur: Math.round(moitie * 0.85) };
  };

  function appuiLong() {
    vibrerLegerement();
    onAppuiLong();
  }

  return (
    <View accessible={false} style={{ width: largeur, padding: ECART }} className={`border-2 border-encre ${coins} ${deMoi ? "bg-jaune" : "bg-carte"}`}>
      <View className="flex-row flex-wrap" style={{ gap: ECART }}>
        {montrees.map((m, i) => (
          <TuileAlbum
            key={m.id}
            conversationId={conversationId}
            message={m}
            {...taille(i)}
            plus={i === TUILES_MAX - 1 ? n - TUILES_MAX : 0}
            libelle={`${libelle}, ${T.voirPhoto(i + 1, n)}`}
            onPress={() => {
              vibrerLegerement();
              Keyboard.dismiss();
              setOuverte(i);
            }}
            onLongPress={appuiLong}
            actionsLecteur={i === 0 ? actionsLecteur : undefined}
          />
        ))}
      </View>
      {legende ? (
        <Pressable accessible={false} onPress={onAppuiTexte} onLongPress={appuiLong} delayLongPress={350} className="px-1.5 pb-1 pt-1.5">
          <Text selectable className={`font-texte text-[15px] leading-5 ${deMoi ? "text-nuit" : "text-encre"}`}>
            {lierPonctuation(legende)}
          </Text>
        </Pressable>
      ) : null}
      {ouverte !== null && n > 0 ? (
        <VisionneusePhotosChat
          visible
          conversationId={conversationId}
          photos={visibles}
          depart={ouverte}
          prenomDe={() => prenom}
          onFermer={() => setOuverte(null)}
          onDoubleAppui={onDoubleAppui}
        />
      ) : null}
    </View>
  );
}
