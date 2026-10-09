import { useEventListener } from "expo";
import type { VideoPlayer } from "expo-video";
import { useEffect, useRef, useState } from "react";
import { Platform, Text, View, type AccessibilityActionEvent, type GestureResponderEvent } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { utiliserLecteurEcran } from "~/hooks/utiliser-lecteur-ecran";

type Props = {
  lecteur: VideoPlayer;
  /** Vidéo à l'écran : seule celle-ci donne son avancée (les autres n'envoient rien) */
  actif: boolean;
  /** Mise en pause par un appui simple : après un réglage, elle reste en pause */
  enPause: boolean;
  /** Durée de la vidéo, en secondes (plus de 0) */
  duree: number;
  largeur: number;
  /** Hauteur de la barre d'onglets : la barre se pose juste au-dessus */
  bas: number;
  /** Réglage commencé (true) ou fini (false) : le fil ne défile pas pendant qu'on fait glisser la barre */
  onGlisser: (enCours: boolean) => void;
};

/** Hauteur de la zone qu'on peut toucher au-dessus de la barre d'onglets : ce qui est posé plus haut ne devrait pas descendre dessous */
export const HAUTEUR_ZONE_PROGRESSION = 40;

// Avancée envoyée par le lecteur 4 fois par seconde ; entre deux, la barre glisse toute seule sur le fil d'animation
const INTERVALLE = 0.25;
const PAS_LECTEUR_ECRAN = 2;
// Pendant qu'on fait glisser, on ne déplace la vidéo que toutes les 80 ms (la barre, elle, suit le doigt)
const ECART_SAUTS = 80;
// Distance parcourue par le doigt avant de savoir s'il règle la vidéo (de côté) ou fait défiler le fil (vers le haut ou le bas)
const SEUIL_DIRECTION = 12;
const RAIL = 5;
const POIGNEE = 14;
const ACTIONS = [
  { name: "increment", label: "Avancer de 2 secondes" },
  { name: "decrement", label: "Reculer de 2 secondes" },
];

/** Doigt posé, sens pas encore connu ; réglage de la vidéo ; ou défilement du fil, que la barre laisse faire */
type Geste = "attente" | "reglage" | "defilement";

// Double toucher de VoiceOver : sans réponse, iOS toucherait le milieu de la barre et la vidéo sauterait à la moitié (on la règle en balayant vers le haut ou le bas)
const ignorerActivation = () => {};

const lireSecondes = (s: number) => `${s} seconde${s > 1 ? "s" : ""}`;
const formaterTemps = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * Fine barre d'avancée en bas d'une vidéo, juste au-dessus de la barre d'onglets : on la touche ou on la fait glisser de côté
 * pour avancer ou reculer (elle grossit pendant le geste, et le temps s'affiche). Un balayage vers le haut ou le bas commencé
 * dessus fait toujours défiler le fil (iOS). VoiceOver la règle de 2 s en 2 s.
 */
export function BarreProgressionVideo({ lecteur, actif, enPause, duree, largeur, bas, onGlisser }: Props) {
  // Temps affiché par la barre (en secondes), et grosseur pendant le geste (0 : fine, 1 : épaisse)
  const temps = useSharedValue(0);
  const grosseur = useSharedValue(0);
  const dernierTemps = useRef(0);
  const geste = useRef<Geste | null>(null);
  const depart = useRef({ x: 0, y: 0 });
  const departX = useRef(0);
  const dernierSaut = useRef(0);
  // Après un réglage, la vidéo ne repart que si elle doit jouer : toujours à l'écran, et pas mise en pause
  const doitJouer = useRef(actif && !enPause);
  // Temps affiché en gros pendant qu'on fait glisser (en secondes entières), sinon null
  const [tempsGlisse, setTempsGlisse] = useState<number | null>(null);
  // La valeur lue par VoiceOver ne suit la lecture que si un lecteur d'écran tourne : sinon, aucun nouveau rendu pendant la vidéo
  const lecteurEcran = utiliserLecteurEcran();
  const [secondesLues, setSecondesLues] = useState(0);

  useEffect(() => {
    doitJouer.current = actif && !enPause;
  }, [actif, enPause]);

  // Démontée en plein réglage (la publication quitte la liste) : le fil retrouve son défilement
  useEffect(
    () => () => {
      if (geste.current === "reglage") onGlisser(false);
    },
    [onGlisser],
  );

  // Seule la vidéo à l'écran envoie son avancée ; en y arrivant, la barre repart de là où en est la vidéo
  useEffect(() => {
    lecteur.timeUpdateEventInterval = actif ? INTERVALLE : 0;
    if (!actif) return;
    dernierTemps.current = lecteur.currentTime;
    temps.value = lecteur.currentTime;
    setSecondesLues(Math.floor(lecteur.currentTime));
  }, [actif, lecteur, temps]);

  useEventListener(lecteur, "timeUpdate", ({ currentTime }) => {
    if (geste.current === "reglage") return;
    const precedent = dernierTemps.current;
    dernierTemps.current = currentTime;
    // Retour au début de la boucle, ou saut : la barre y va d'un coup ; sinon elle glisse jusqu'au prochain envoi
    if (currentTime < precedent || currentTime - precedent > 1.5) temps.value = currentTime;
    else temps.value = withTiming(currentTime, { duration: INTERVALLE * 1000, easing: Easing.linear });
    if (lecteurEcran) setSecondesLues(Math.floor(currentTime));
  });

  function allerA(secondes: number) {
    const t = Math.min(Math.max(secondes, 0), Math.max(duree - 0.1, 0));
    lecteur.currentTime = t;
    temps.value = t;
    dernierTemps.current = t;
    return t;
  }

  function tempsSousLeDoigt(pageX: number) {
    const x = Math.min(Math.max(pageX - departX.current, 0), largeur);
    return (x / largeur) * duree;
  }

  function suivreDoigt(pageX: number) {
    const t = tempsSousLeDoigt(pageX);
    temps.value = t;
    setTempsGlisse(Math.floor(t));
    const maintenant = Date.now();
    if (maintenant - dernierSaut.current < ECART_SAUTS) return;
    dernierSaut.current = maintenant;
    lecteur.currentTime = t;
  }

  function poserDoigt(e: GestureResponderEvent) {
    // Le bord gauche de la zone, en coordonnées de l'écran (le doigt peut ensuite sortir de la zone)
    departX.current = e.nativeEvent.pageX - e.nativeEvent.locationX;
    depart.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
    geste.current = "attente";
    // Android : la liste du fil ne reprend pas le geste en cours de route (sur iOS, ce refus ne l'arrête pas : d'où le sens du geste)
    return true;
  }

  function bougerDoigt(e: GestureResponderEvent) {
    const { pageX, pageY } = e.nativeEvent;
    if (geste.current === "attente") {
      const dx = Math.abs(pageX - depart.current.x);
      const dy = Math.abs(pageY - depart.current.y);
      if (Math.max(dx, dy) < SEUIL_DIRECTION) return;
      // Un pouce qui remonte en arc depuis le bas fait défiler le fil : seul un geste nettement de côté règle la vidéo
      if (Platform.OS === "ios" && dx < dy * 2) {
        geste.current = "defilement";
        return;
      }
      // Parti de côté : le fil arrête de défiler et la vidéo attend la fin du réglage
      geste.current = "reglage";
      onGlisser(true);
      lecteur.pause();
      dernierSaut.current = 0;
      grosseur.value = withTiming(1, { duration: 120 });
    }
    if (geste.current === "reglage") suivreDoigt(pageX);
  }

  function leverDoigt(e: GestureResponderEvent | null) {
    const fin = geste.current;
    geste.current = null;
    // Le fil a défilé, ou le geste a été repris avant de partir de côté : la vidéo ne bouge pas
    if (fin === "defilement" || fin === null || (fin === "attente" && !e)) return;
    // Simple toucher : la vidéo saute là sans s'arrêter ; fin de réglage : elle repart, si elle est toujours à l'écran
    const t = allerA(e ? tempsSousLeDoigt(e.nativeEvent.pageX) : temps.value);
    setSecondesLues(Math.floor(t));
    if (fin !== "reglage") return;
    grosseur.value = withTiming(0, { duration: 180 });
    setTempsGlisse(null);
    onGlisser(false);
    if (doitJouer.current) lecteur.play();
  }

  function ajuster(e: AccessibilityActionEvent) {
    const pas = e.nativeEvent.actionName === "increment" ? PAS_LECTEUR_ECRAN : e.nativeEvent.actionName === "decrement" ? -PAS_LECTEUR_ECRAN : 0;
    if (!pas) return;
    setSecondesLues(Math.floor(allerA(lecteur.currentTime + pas)));
  }

  const styleRail = useAnimatedStyle(() => ({ transform: [{ scaleY: 0.4 + 0.6 * grosseur.value }] }));
  const styleRempli = useAnimatedStyle(() => ({ transform: [{ translateX: -largeur * (1 - Math.min(Math.max(temps.value / duree, 0), 1)) }] }));
  const stylePoignee = useAnimatedStyle(() => ({
    opacity: grosseur.value,
    transform: [{ translateX: largeur * Math.min(Math.max(temps.value / duree, 0), 1) - POIGNEE / 2 }, { scale: 0.4 + 0.6 * grosseur.value }],
  }));

  const total = Math.max(1, Math.round(duree));

  return (
    <>
      {tempsGlisse !== null ? (
        <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: "absolute", left: 0, right: 0, top: "42%" }} className="items-center">
          <View className="flex-row items-baseline gap-1.5 rounded-full bg-black/60 px-4 py-2">
            <Text className="font-titre-gras text-2xl text-white">{formaterTemps(tempsGlisse)}</Text>
            <Text className="font-texte-semi text-base text-white/75">/ {formaterTemps(duree)}</Text>
          </View>
        </View>
      ) : null}
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Avancée de la vidéo"
        accessibilityValue={{ text: `${lireSecondes(Math.min(secondesLues, total))} sur ${total}` }}
        accessibilityActions={ACTIONS}
        onAccessibilityAction={ajuster}
        onAccessibilityTap={ignorerActivation}
        onStartShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={poserDoigt}
        onResponderMove={bougerDoigt}
        onResponderRelease={leverDoigt}
        onResponderTerminate={() => leverDoigt(null)}
        style={{ position: "absolute", left: 0, right: 0, bottom: bas, height: HAUTEUR_ZONE_PROGRESSION }}
      >
        {/* Rail et poignée ne prennent pas le toucher : la position du doigt se lit toujours sur la zone entière */}
        <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 0, right: 0, bottom: 1, height: RAIL, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.28)" }, styleRail]}>
          <Animated.View style={[{ position: "absolute", top: 0, bottom: 0, left: 0, width: largeur, backgroundColor: "rgba(255,255,255,0.92)" }, styleRempli]} />
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[{ position: "absolute", left: 0, bottom: 1 + RAIL / 2 - POIGNEE / 2, width: POIGNEE, height: POIGNEE, borderRadius: POIGNEE / 2, backgroundColor: "#FFFFFF" }, stylePoignee]}
        />
      </View>
    </>
  );
}
