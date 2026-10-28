import { useState } from "react";
import { Keyboard, Pressable, Text, useWindowDimensions, View, type PressableProps } from "react-native";

import { TuileAlbumChat } from "~/composants/chat/TuileAlbumChat";
import { VisionneusePhotosChat } from "~/composants/chat/VisionneusePhotosChat";
import { TEXTES_MEDIAS_CHAT_PAR_LANGUE } from "~/contenus/textes-medias-chat";
import type { MessageChatEnrichi } from "~/contenus/type-discussion-chat";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

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

export function AlbumChat({ conversationId, photos, legende, deMoi, prenom, libelle, onAppuiLong, onAppuiTexte, onDoubleAppui, actionsLecteur }: Props) {
  const { width } = useWindowDimensions();
  const T = utiliserTextes(TEXTES_MEDIAS_CHAT_PAR_LANGUE);
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
          <TuileAlbumChat
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
