import { File } from "expo-file-system";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import { Keyboard, Platform, Pressable, Text, useWindowDimensions, type PressableProps } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import { VisionneusePhotosChat } from "~/composants/chat/VisionneusePhotosChat";
import { TEXTES_CHAT_BULLES_PAR_LANGUE } from "~/contenus/textes-chat-bulles";
import { TEXTES_MEDIAS_CHAT_PAR_LANGUE } from "~/contenus/textes-medias-chat";
import type { MessageChatEnrichi } from "~/contenus/type-discussion-chat";
import { lireSourcePhotoChat } from "~/fonctions/chat/lire-source-photo-chat";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  conversationId: string;
  message: MessageChatEnrichi;
  prenom: string;
  /** Adresse de la photo dans les fichiers de l'app */
  fichier: string | undefined;
  /** Qui l'a envoyée et quand : « Photo de Léa, 14h32 », « Ta photo, 14h32 » */
  libelle: string;
  /** Ta photo : coin arrondi du côté droit, comme tes bulles */
  deMoi: boolean;
  /** Appui long : le menu du message (réactions, signaler) */
  onAppuiLong: () => void;
  /** Double appui sur la photo en grand : bascule ton « miam » ; renvoie vrai s'il vient d'être mis (le 😋 s'affiche alors en grand) */
  onDoubleAppui: () => boolean;
  /** Actions du lecteur d'écran (cœur, options), posées sur la vignette */
  actionsLecteur?: Pick<PressableProps, "accessibilityActions" | "onAccessibilityAction">;
};

// Ni trop haute, ni trop plate (largeur / hauteur)
const RATIO_MIN = 0.7;
const RATIO_MAX = 1.4;
const RATIO_INCONNU = 0.8;
// La forme de chaque photo déjà chargée : une bulle qui revient à l'écran (en remontant relire) a tout de suite sa bonne hauteur
const ratiosConnus = new Map<string, number>();

/** Vrai si le fichier est encore là (sur le web, on ne peut pas vérifier : la photo dira elle-même si elle se charge). */
function existeEncore(fichier: string): boolean {
  if (Platform.OS === "web" || fichier.startsWith("exemple:")) return true;
  try {
    return new File(fichier).exists;
  } catch {
    return false;
  }
}

/**
 * Une photo du chat : vignette arrondie à bord encre ; la toucher l'ouvre en grand (VisionneusePhotosChat, double appui en
 * grand : un 😋). Fichier disparu ou illisible : un joli remplaçant plutôt qu'un trou.
 */
export function PhotoChat({ conversationId, message, prenom, fichier, libelle, deMoi, onAppuiLong, onDoubleAppui, actionsLecteur }: Props) {
  const { width } = useWindowDimensions();
  const T = utiliserTextes(TEXTES_CHAT_BULLES_PAR_LANGUE);
  const T_MEDIAS = utiliserTextes(TEXTES_MEDIAS_CHAT_PAR_LANGUE);
  const animationsReduites = useReducedMotion();
  const present = useMemo(() => !!fichier && existeEncore(fichier), [fichier]);
  const [illisible, setIllisible] = useState(false);
  const [ratio, setRatio] = useState(() => (fichier ? ratiosConnus.get(fichier) : undefined) ?? RATIO_INCONNU);
  const [grande, setGrande] = useState(false);

  const largeur = Math.min(240, Math.round(width * 0.62));
  const coins = deMoi ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-tl-md";

  if (!fichier || !present || illisible) {
    return (
      <Pressable
        accessibilityLabel={T.photoPartieLu(libelle)}
        onLongPress={() => {
          vibrerLegerement();
          onAppuiLong();
        }}
        delayLongPress={350}
        {...actionsLecteur}
        style={{ width: largeur }}
        className={`items-center gap-1 border-2 border-dashed border-gris/40 bg-carte/70 px-4 py-6 ${coins}`}
      >
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-3xl">
          📷
        </Text>
        <Text className="text-center font-texte-semi text-sm text-gris">{T_MEDIAS.photoPartie}</Text>
      </Pressable>
    );
  }

  return (
    <>
      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel={libelle}
        accessibilityHint={T.ouvrePhoto}
        onPress={() => {
          vibrerLegerement();
          // Le clavier resterait par-dessus la photo en grand
          Keyboard.dismiss();
          setGrande(true);
        }}
        onLongPress={() => {
          vibrerLegerement();
          onAppuiLong();
        }}
        delayLongPress={350}
        {...actionsLecteur}
        style={{ width: largeur, height: largeur / ratio }}
        className={`overflow-hidden border-2 border-encre bg-ligne active:opacity-80 ${coins}`}
      >
        <Image
          source={lireSourcePhotoChat(fichier)}
          contentFit="cover"
          transition={animationsReduites ? 0 : 150}
          onLoad={({ source }) => {
            if (source.width <= 0 || source.height <= 0) return;
            const forme = Math.min(RATIO_MAX, Math.max(RATIO_MIN, source.width / source.height));
            ratiosConnus.set(fichier, forme);
            setRatio(forme);
          }}
          onError={() => setIllisible(true)}
          style={{ flex: 1 }}
        />
      </Pressable>

      {grande ? (
        <VisionneusePhotosChat
          visible
          conversationId={conversationId}
          photos={[message]}
          depart={0}
          prenomDe={() => prenom}
          onFermer={() => setGrande(false)}
          onDoubleAppui={onDoubleAppui}
        />
      ) : null}
    </>
  );
}
