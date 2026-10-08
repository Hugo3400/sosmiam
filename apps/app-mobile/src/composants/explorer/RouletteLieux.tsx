import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Keyboard, Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { publicationsExemples } from "~/contenus/publications-exemples";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { formaterDistance } from "~/fonctions/geo/formater-distance";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import type { LieuExplorer } from "~/fonctions/lieux/trier-lieux-explorer";
import { trouverVignetteLieu } from "~/fonctions/publications/trouver-vignette-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserActivite } from "~/hooks/utiliser-activite";

type Props = {
  visible: boolean;
  /** Les lieux d'Explorer, déjà filtrés : la roulette pioche dedans */
  lieux: LieuExplorer[];
  onFermer: () => void;
  onOuvrir: (id: number) => void;
};

const ETAPES = 16;
const HAUTEUR_ROULEAU = 22;
// Attente avant chaque étape : très rapide au début, puis de plus en plus lent (environ 2,5 secondes en tout)
const attenteEtape = (i: number) => 55 + 380 * Math.pow(i / (ETAPES - 1), 2.4);

/** Un lieu au hasard, en évitant si possible les identifiants exclus (le premier exclu compte le plus). */
function piocher(lieux: LieuExplorer[], exclus: (number | null)[]): LieuExplorer {
  for (let n = exclus.length; n >= 0; n--) {
    const gardes = exclus.slice(0, n);
    const candidats = lieux.filter((l) => !gardes.includes(l.lieu.id));
    if (candidats.length > 0) return candidats[Math.floor(Math.random() * candidats.length)];
  }
  return lieux[0];
}

/** Ce que le lecteur d'écran dit du lieu tiré */
function decrire({ lieu, km }: LieuExplorer): string {
  return [
    lieu.nom,
    lieu.info,
    `${lieu.quartier}, ${lieu.ville}, à ${formaterDistance(km)}`,
    lieu.sos ? `SOS ce soir : ${lieu.sos.places} place${lieu.sos.places > 1 ? "s" : ""} jusqu'à ${formaterHeure(lieu.sos.jusqua)}${lieu.sos.offre ? `, ${lieu.sos.offre}` : ""}` : null,
  ]
    .filter(Boolean)
    .join(". ");
}

/**
 * La roulette d'Explorer : les lieux défilent vite, ralentissent et s'arrêtent sur un (direct si les animations sont réduites),
 * petite vibration à l'arrivée, résultat dit au lecteur d'écran. Jamais deux fois de suite le même lieu quand il y en a plusieurs.
 */
export function RouletteLieux({ visible, lieux, onFermer, onOuvrir }: Props) {
  const marges = useSafeAreaInsets();
  const { height: hauteurEcran } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const { estMasquee } = utiliserActivite();
  const [affiche, setAffiche] = useState<LieuExplorer | null>(null);
  const [tourne, setTourne] = useState(false);
  const dernierTirage = useRef<number | null>(null);
  const minuteries = useRef<ReturnType<typeof setTimeout>[]>([]);
  const decalage = useSharedValue(0);
  const echelle = useSharedValue(1);

  // À chaque ouverture, on repart d'une roulette vide (sans montrer l'ancien tirage le temps d'un rendu)
  const [ouvert, setOuvert] = useState(visible);
  if (visible !== ouvert) {
    setOuvert(visible);
    if (visible) {
      setAffiche(null);
      setTourne(lieux.length > 1 && !animationsReduites);
    }
  }

  function arreterMinuteries() {
    minuteries.current.forEach(clearTimeout);
    minuteries.current = [];
  }

  // Le nouveau lieu arrive par le haut, comme un rouleau de machine à sous
  function rouler(duree: number) {
    decalage.value = -HAUTEUR_ROULEAU;
    decalage.value = withTiming(0, { duration: duree });
  }

  function arriver(tirage: LieuExplorer) {
    setAffiche(tirage);
    setTourne(false);
    vibrerLegerement();
    if (!animationsReduites) {
      rouler(220);
      echelle.value = withSequence(withTiming(1.05, { duration: 140 }), withSpring(1, { damping: 9 }));
    }
    if (Platform.OS === "web") return;
    const annonce = `La roulette a choisi : ${decrire(tirage)}`;
    // Sur iPhone, l'annonce attend que VoiceOver ait fini sa phrase en cours
    if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibilityWithOptions(annonce, { queue: true });
    else AccessibilityInfo.announceForAccessibility(annonce);
  }

  function lancer() {
    arreterMinuteries();
    if (lieux.length === 0) {
      setAffiche(null);
      setTourne(false);
      return;
    }
    const gagnant = piocher(lieux, [dernierTirage.current]);
    dernierTirage.current = gagnant.lieu.id;
    if (animationsReduites || lieux.length === 1) {
      arriver(gagnant);
      return;
    }
    setTourne(true);
    let attente = 0;
    let precedent = affiche?.lieu.id ?? null;
    for (let i = 0; i < ETAPES; i++) {
      const derniere = i === ETAPES - 1;
      // Jamais deux fois le même lieu d'affilée, et l'avant-dernier n'est pas le gagnant : on le voit bien s'arrêter dessus
      const lieu = derniere ? gagnant : piocher(lieux, i === ETAPES - 2 ? [gagnant.lieu.id, precedent] : [precedent]);
      precedent = lieu.lieu.id;
      attente += attenteEtape(i);
      const duree = Math.min(160, attenteEtape(i + 1) * 0.8);
      minuteries.current.push(
        setTimeout(() => {
          if (derniere) {
            arriver(lieu);
            return;
          }
          setAffiche(lieu);
          rouler(duree);
        }, attente),
      );
    }
  }

  // La roulette se lance à l'ouverture et s'arrête net à la fermeture
  useEffect(() => {
    if (!visible) return;
    // Le clavier de la recherche cacherait le bas de la roulette (Relancer, Fermer)
    Keyboard.dismiss();
    lancer();
    return arreterMinuteries;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seulement à l'ouverture, avec les lieux de ce moment-là
  }, [visible]);

  const styleCadre = useAnimatedStyle(() => ({ transform: [{ scale: echelle.value }] }));
  const styleRouleau = useAnimatedStyle(() => ({ transform: [{ translateY: decalage.value }] }));

  const lieu = affiche?.lieu ?? null;
  // L'image seulement une fois arrêtée : pendant que ça tourne, le dégradé et l'emoji suffisent (et ne clignotent pas)
  const image = lieu && !tourne ? trouverVignetteLieu(lieu.id, publicationsExemples.filter((p) => !estMasquee(p.id))) : null;
  const seul = lieux.length === 1;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFermer}>
      <View style={{ paddingTop: marges.top + 16, paddingBottom: marges.bottom + 16 }} className="flex-1 items-center justify-center px-4">
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer la roulette" onPress={onFermer} style={{ position: "absolute", inset: 0 }} className="bg-black/50" />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={onFermer}
          style={{ maxHeight: hauteurEcran - marges.top - marges.bottom - 32 }}
          className="w-full max-w-[420px] overflow-hidden rounded-carte border-2 border-encre bg-creme"
        >
          <ScrollView style={{ flexGrow: 0 }} bounces={false} contentContainerClassName="gap-4 p-5">
            <View className="gap-1">
              <View className="flex-row items-start gap-2">
                <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-3xl">🎰</Text>
                <Text accessibilityRole="header" className="flex-1 font-titre text-2xl leading-7 text-encre">
                  {lierPonctuation("Tu sais pas où aller ? On choisit pour toi")}
                </Text>
              </View>
              {lieux.length > 1 ? (
                <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(`${lieux.length} lieux dans la roulette, selon tes filtres.`)}</Text>
              ) : null}
            </View>

            {lieux.length === 0 ? (
              <View className="items-center gap-3 rounded-carte border-2 border-dashed border-ligne px-5 py-6">
                <Mascotte expression="surprise" taille={96} />
                <Text className="text-center font-texte-semi text-base leading-6 text-encre">{lierPonctuation("Aucun lieu avec ces filtres : élargis un peu !")}</Text>
              </View>
            ) : (
              <Animated.View style={styleCadre}>
                {/* Pendant que ça tourne, une seule phrase pour le lecteur d'écran, pas une rafale de noms */}
                <View
                  accessible
                  accessibilityLabel={tourne || !affiche ? "La roulette tourne…" : decrire(affiche)}
                  // Sur iPhone, l'état « busy » est lu en anglais : le libellé « La roulette tourne… » suffit
                  accessibilityState={Platform.OS === "ios" ? undefined : { busy: tourne }}
                  className="overflow-hidden rounded-carte border-2 border-encre bg-white"
                >
                  <Animated.View style={styleRouleau}>
                    <View className="h-36 items-center justify-center overflow-hidden bg-encre">
                      {lieu ? (
                        <>
                          <LinearGradient colors={lieu.couleurs} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ position: "absolute", inset: 0 }} />
                          {image ? (
                            <Image source={image} contentFit="cover" transition={animationsReduites ? 0 : 200} style={{ position: "absolute", inset: 0 }} />
                          ) : (
                            <Text className="text-6xl">{lieu.emoji}</Text>
                          )}
                          {lieu.sos ? (
                            <Text className="absolute left-3 top-3 overflow-hidden rounded-full border-2 border-encre bg-jaune px-3 py-1 font-texte-gras text-[13px] text-encre">
                              🛟 SOS · {lieu.sos.places} place{lieu.sos.places > 1 ? "s" : ""} jusqu'à {formaterHeure(lieu.sos.jusqua)}
                            </Text>
                          ) : null}
                        </>
                      ) : (
                        <Text className="text-6xl">🎲</Text>
                      )}
                    </View>
                    <View className="gap-1 px-4 py-3">
                      <Text numberOfLines={1} className="font-titre text-xl text-encre">{lieu ? lieu.nom : "On mélange…"}</Text>
                      <Text numberOfLines={1} className="font-texte-moyen text-sm text-gris">
                        {lieu ? `${lieu.info} · ${lieu.prix}${lieu.sos?.offre ? ` · ${lieu.sos.offre}` : ""}` : " "}
                      </Text>
                      <Text numberOfLines={1} className="font-texte-moyen text-sm text-encre">
                        {affiche && lieu ? `📍 ${lieu.quartier}, ${lieu.ville} · ${formaterDistance(affiche.km)}` : " "}
                      </Text>
                    </View>
                  </Animated.View>
                </View>
              </Animated.View>
            )}

            {seul ? (
              <Text className="text-center font-texte text-sm leading-5 text-gris">{lierPonctuation("C'est le seul lieu qui colle à tes filtres : le destin a parlé !")}</Text>
            ) : null}

            <View className="gap-3">
              {lieux.length > 0 ? (
                <Bouton
                  libelle={tourne ? "Ça tourne…" : "Voir la fiche"}
                  desactive={tourne || !affiche}
                  indice={affiche && !tourne ? `Ouvre la fiche de ${affiche.lieu.nom}` : undefined}
                  onPress={() => {
                    if (affiche) onOuvrir(affiche.lieu.id);
                  }}
                />
              ) : null}
              <View className="flex-row gap-3">
                {lieux.length > 1 ? <Bouton libelle="Relancer" variante="blanc" petit desactive={tourne} onPress={lancer} className="flex-1" /> : null}
                <Bouton libelle="Fermer" variante={lieux.length === 0 ? "jaune" : "blanc"} petit onPress={onFermer} className="flex-1" />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
