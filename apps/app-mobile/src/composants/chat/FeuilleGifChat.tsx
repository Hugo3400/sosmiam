import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { AccessibilityInfo, ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LONGUEUR_MAX_RECHERCHE_GIF } from "@sos-miam/commun/regles/chat";
import type { GifApi } from "@sos-miam/commun/types/messagerie";
import { ImageGifChat } from "~/composants/chat/ImageGifChat";
import { Pastille } from "~/composants/interface/Pastille";
import { PoigneeFeuille } from "~/composants/interface/PoigneeFeuille";
import { PASTILLES_GIF, PASTILLES_GIF_PAR_LANGUE, TEXTES_MEDIAS_CHAT_PAR_LANGUE } from "~/contenus/textes-medias-chat";
import { calculerTailleGif } from "~/fonctions/chat/calculer-taille-gif";
import { repartirGifsColonnes } from "~/fonctions/chat/repartir-gifs-colonnes";
import { retirerEmojiAnnonce } from "~/fonctions/chat/retirer-emoji-annonce";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserGlisserPourFermer } from "~/hooks/utiliser-glisser-pour-fermer";
import { utiliserInscriptionFeuille } from "~/hooks/utiliser-inscription-feuille";
import { utiliserRechercheGifs } from "~/hooks/utiliser-recherche-gifs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  visible: boolean;
  conversationId: string;
  onEnvoye: () => void;
  onFermer: () => void;
};

const ECART = 6;
const MARGE = 16;
const PRES_DE_LA_FIN = 400;

export function FeuilleGifChat({ visible, conversationId, onEnvoye, onFermer }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_MEDIAS_CHAT_PAR_LANGUE);
  const pastilles = utiliserTextes(PASTILLES_GIF_PAR_LANGUE);
  const marges = useSafeAreaInsets();
  utiliserInscriptionFeuille(visible, onFermer);
  const geste = utiliserGlisserPourFermer(visible, onFermer);
  const { width, height } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const { envoyerGif } = utiliserConversations();
  const [texte, setTexte] = useState("");
  const [pastille, setPastille] = useState<(typeof PASTILLES_GIF)[number]["cle"]>("tendances");
  const [souci, setSouci] = useState<string | null>(null);
  const [ouverte, setOuverte] = useState(visible);
  if (visible !== ouverte) {
    setOuverte(visible);
    if (visible) {
      setTexte("");
      setPastille("tendances");
      setSouci(null);
    }
  }

  const choisie = pastilles[Math.max(0, PASTILLES_GIF.findIndex((p) => p.cle === pastille))];
  const recherche = utiliserRechercheGifs(visible, texte, choisie.mot);
  const largeurColonne = Math.floor((width - 2 * MARGE - ECART) / 2);
  const colonnes = repartirGifsColonnes(recherche.gifs, largeurColonne, ECART);
  const tous = recherche.gifs.length;

  function envoyer(gif: GifApi) {
    vibrerLegerement();
    if (envoyerGif(conversationId, gif) !== "ok") {
      setSouci(T.gifPasParti);
      AccessibilityInfo.announceForAccessibility(retirerEmojiAnnonce(T.gifPasParti));
      return;
    }
    onEnvoye();
  }

  function suivreDefilement(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    if (contentSize.height - contentOffset.y - layoutMeasurement.height < PRES_DE_LA_FIN) recherche.chargerSuite();
  }

  const etatVide =
    recherche.etat === "indisponible"
      ? { emoji: "😴", titre: T.gifsSieste, texte: T.gifsSiesteTexte }
      : recherche.etat === "reseau"
        ? { emoji: "📡", titre: T.gifsVidesTitre, texte: T.gifsReseau }
        : recherche.etat === "vide"
          ? { emoji: "🔍", titre: T.gifsVidesTitre, texte: T.gifsVides }
          : null;

  return (
    <Modal visible={visible} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={onFermer}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={T.fermerGif} onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
        <Animated.View accessibilityViewIsModal onAccessibilityEscape={onFermer} onLayout={geste.mesurerFeuille} style={[{ height: Math.round(height * 0.8) }, geste.styleFeuille]}>
          <View style={{ flex: 1, paddingBottom: marges.bottom + 8 }} className="rounded-t-3xl border-t-2 border-encre bg-carte">
            <PoigneeFeuille geste={geste} ecart="petit" className="px-4">
              <View className="flex-row items-center gap-2 pb-1">
                <Text accessibilityRole="header" className="flex-1 font-titre text-2xl text-encre">
                  {T.gifsTitre}
                </Text>
                <Pressable accessibilityRole="button" accessibilityLabel={T.fermerGif} onPress={onFermer} className="-mr-2 h-11 w-11 items-center justify-center rounded-full active:opacity-60">
                  <Ionicons name="close" size={24} color={couleurs.encre} />
                </Pressable>
              </View>
            </PoigneeFeuille>

            <View className="gap-3 px-4 pb-3">
              <View className="min-h-12 flex-row items-center gap-2.5 rounded-full border-2 border-encre bg-creme px-4">
                <Ionicons name="search" size={18} color={couleurs.gris} />
                <TextInput
                  accessibilityLabel={T.chercherGifLu}
                  value={texte}
                  onChangeText={setTexte}
                  placeholder={T.chercherGif}
                  placeholderTextColor={couleurs.gris}
                  selectionColor={couleurs.encre}
                  cursorColor={couleurs.encre}
                  maxLength={LONGUEUR_MAX_RECHERCHE_GIF}
                  autoCorrect={false}
                  returnKeyType="search"
                  className="min-h-11 flex-1 font-texte text-[15px] text-encre"
                />
                {texte ? (
                  <Pressable accessibilityRole="button" accessibilityLabel={T.effacerRechercheGif} hitSlop={8} onPress={() => setTexte("")} className="h-8 w-8 items-center justify-center active:opacity-60">
                    <Ionicons name="close-circle" size={20} color={couleurs.gris} />
                  </Pressable>
                ) : null}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerClassName="gap-2">
                {PASTILLES_GIF.map((p, i) => (
                  <Pastille
                    key={p.cle}
                    libelle={pastilles[i].libelle}
                    role="radio"
                    choisi={texte.trim() === "" && pastille === p.cle}
                    position={i + 1}
                    total={PASTILLES_GIF.length}
                    onPress={() => {
                      setTexte("");
                      setPastille(p.cle);
                    }}
                  />
                ))}
              </ScrollView>
              {souci ? <Text className="font-texte-semi text-sm leading-5 text-rouge-texte">{lierPonctuation(souci)}</Text> : null}
            </View>

            <ScrollView
              className="flex-1"
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              onScroll={suivreDefilement}
              scrollEventThrottle={120}
              contentContainerStyle={{ paddingHorizontal: MARGE, paddingBottom: 12 }}
            >
              {recherche.etat === "chargement" ? (
                <View className="items-center py-10">
                  <ActivityIndicator color={couleurs.encre} />
                </View>
              ) : etatVide ? (
                <View accessibilityLiveRegion="polite" className="items-center gap-2 rounded-carte border-2 border-dashed border-ligne px-6 py-8">
                  <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-4xl">
                    {etatVide.emoji}
                  </Text>
                  <Text className="text-center font-texte-gras text-base text-encre">{etatVide.titre}</Text>
                  <Text className="text-center font-texte text-[15px] leading-6 text-gris">{lierPonctuation(etatVide.texte)}</Text>
                  {recherche.etat === "vide" ? null : (
                    <Pressable accessibilityRole="button" onPress={recherche.reessayer} className="mt-1 min-h-11 justify-center rounded-full border-2 border-encre bg-carte px-5 active:opacity-80">
                      <Text className="font-texte-gras text-sm text-encre">{T.reessayer}</Text>
                    </Pressable>
                  )}
                </View>
              ) : (
                <View className="flex-row" style={{ gap: ECART }}>
                  {colonnes.map((colonne, c) => (
                    <View key={c} style={{ width: largeurColonne, gap: ECART }}>
                      {colonne.map((gif) => {
                        const taille = calculerTailleGif(gif, largeurColonne);
                        const numero = recherche.gifs.indexOf(gif) + 1;
                        return (
                          <Pressable
                            key={gif.id}
                            accessibilityRole="button"
                            accessibilityLabel={T.gifNumero(numero, tous)}
                            accessibilityHint={T.envoyerGifIndice}
                            onPress={() => envoyer(gif)}
                            className="overflow-hidden rounded-[10px] active:opacity-70"
                          >
                            <ImageGifChat gif={gif} largeur={taille.largeur} hauteur={taille.hauteur} />
                          </Pressable>
                        );
                      })}
                    </View>
                  ))}
                </View>
              )}
              {recherche.chargementSuite ? (
                <View className="items-center py-4">
                  <ActivityIndicator color={couleurs.encre} />
                </View>
              ) : null}
            </ScrollView>

            <Text className="pt-2 text-center font-texte-gras text-xs tracking-wider text-gris">{T.poweredByGiphy}</Text>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
