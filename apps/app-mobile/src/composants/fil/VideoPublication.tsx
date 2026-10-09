import { Ionicons } from "@expo/vector-icons";
import { useEvent, useEventListener } from "expo";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { BarreProgressionVideo } from "~/composants/fil/BarreProgressionVideo";
import { BoutonSon } from "~/composants/fil/BoutonSon";
import type { MediaPublication } from "~/contenus/type-publication";
import { utiliserRetoursPremierPlan } from "~/hooks/utiliser-retours-premier-plan";
import { utiliserSonFil } from "~/hooks/utiliser-son-fil";

type Props = {
  media: Extract<MediaPublication, { type: "video" }>;
  /** Publication affichée à l'écran : seule celle-ci joue */
  actif: boolean;
  /** Mise en pause par un appui simple */
  enPause: boolean;
  /** Appui long en cours : la vidéo file en x2 */
  acceleree: boolean;
  largeur: number;
  /** Rangée d'indications, juste sous l'en-tête du fil (bouton du son) */
  margeHaut: number;
  /** Hauteur de la barre d'onglets (barre d'avancée posée juste au-dessus) */
  margeBas: number;
  /** Réglage de la barre d'avancée commencé (true) ou fini (false) : le fil ne défile pas pendant ce temps */
  onGlisserBarre: (enCours: boolean) => void;
};

/** La vidéo qu'on quitte continue de bouger le temps de sortir de l'écran, puis se met en pause (ms) */
const DELAI_PAUSE_SORTIE = 350;
/** La vue native d'une vidéo coûte cher à créer : montée en plein glissé, la publication montre d'abord son affiche (ms) */
const DELAI_VUE_VIDEO = 800;

// Les commandes passent au-dessus de la zone d'appui de la publication (posée après le média) : sinon on ne pourrait pas les toucher
const styleCommandes = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 1 } as const;

/**
 * Vidéo d'une publication, en plein écran et en boucle ; son affiche reste dessous tant qu'elle ne joue pas. Seule celle à
 * l'écran joue et a du son ; celle qu'on quitte se met en pause une fois sortie, et la vue native n'est créée qu'une fois
 * le fil posé (créée en plein glissé, elle faisait sauter des images). Le son suit le
 * réglage commun du fil (coupé par défaut, bouton seulement si la vidéo a du son), une barre d'avancée permet d'avancer ou
 * de reculer, et l'appui long la passe en x2.
 */
export function VideoPublication({ media, actif, enPause, acceleree, largeur, margeHaut, margeBas, onGlisserBarre }: Props) {
  const { sonCoupe, basculerSon } = utiliserSonFil();
  // En arrière-plan (verrouillage, autre app, appel), le téléphone met la vidéo en pause sans la relancer au retour : on s'en charge
  const retoursPremierPlan = utiliserRetoursPremierPlan();
  const lecteur = useVideoPlayer(media.video, (l) => {
    l.loop = true;
    l.muted = true;
    // Muette, elle ne coupe pas la musique qui joue à côté sur le téléphone
    l.audioMixingMode = "auto";
  });
  const { isPlaying } = useEvent(lecteur, "playingChange", { isPlaying: lecteur.playing });
  // Durée et piste son ne sont connues qu'une fois la vidéo chargée (un seul nouveau rendu)
  const [infos, setInfos] = useState({ duree: 0, aDuSon: false });

  function lireInfos() {
    const duree = Number.isFinite(lecteur.duration) && lecteur.duration > 0 ? lecteur.duration : 0;
    const aDuSon = lecteur.availableAudioTracks.length > 0;
    setInfos((avant) => (avant.duree === duree && avant.aDuSon === aDuSon ? avant : { duree, aDuSon }));
  }
  useEventListener(lecteur, "sourceLoad", lireInfos);
  useEventListener(lecteur, "availableAudioTracksChange", lireInfos);
  useEventListener(lecteur, "statusChange", ({ status }) => {
    if (status === "readyToPlay") lireInfos();
  });

  const x2 = actif && acceleree;
  useEffect(() => {
    // Sur iPhone, régler la vitesse relance la lecture (même à 1) : on n'y touche que si elle change, et avant play / pause
    // (sinon une vidéo tout juste montée hors de l'écran se mettait à jouer en cachette)
    const vitesse = x2 ? 2 : 1;
    if (lecteur.playbackRate !== vitesse) lecteur.playbackRate = vitesse;
    if (actif && !enPause) {
      lecteur.play();
      return;
    }
    if (actif) {
      lecteur.pause();
      return;
    }
    // Une fois sortie de l'écran : pause, et retour au début de la boucle (on la retrouvera depuis le début)
    const minuterie = setTimeout(() => {
      lecteur.pause();
      lecteur.currentTime = 0;
    }, DELAI_PAUSE_SORTIE);
    return () => clearTimeout(minuterie);
  }, [actif, enPause, x2, lecteur, retoursPremierPlan]);

  // Seule la vidéo à l'écran a du son ; une vidéo sans son reste muette même son activé
  const muette = sonCoupe || !infos.aDuSon || !actif;
  useEffect(() => {
    lecteur.muted = muette;
  }, [muette, lecteur]);

  // La vue native se crée une fois le fil posé (ou tout de suite si la vidéo est à l'écran), puis ne se recrée plus
  const [vuePrete, setVuePrete] = useState(actif);
  useEffect(() => {
    if (vuePrete) return;
    if (actif) {
      setVuePrete(true);
      return;
    }
    const minuterie = setTimeout(() => setVuePrete(true), DELAI_VUE_VIDEO);
    return () => clearTimeout(minuterie);
  }, [actif, vuePrete]);

  return (
    <>
      <View style={{ position: "absolute", inset: 0 }}>
        <Image source={media.affiche} contentFit="cover" style={{ position: "absolute", inset: 0 }} />
        {vuePrete || actif ? (
          <VideoView player={lecteur} contentFit="cover" nativeControls={false} allowsVideoFrameAnalysis={false} style={{ position: "absolute", inset: 0 }} />
        ) : null}
        {actif && enPause && !isPlaying ? (
          <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-black/40">
              <Ionicons name="play" size={40} color="#FFFFFF" />
            </View>
          </View>
        ) : null}
      </View>
      <View pointerEvents="box-none" style={styleCommandes}>
        {infos.aDuSon ? <BoutonSon sonCoupe={sonCoupe} onBasculer={basculerSon} haut={margeHaut} /> : null}
        {x2 ? (
          <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ top: margeHaut + 40 }} className="absolute inset-x-0 items-center">
            <View className="flex-row items-center gap-1 rounded-full bg-black/55 px-3 py-1.5">
              <Text className="font-texte-gras text-sm text-white">2x</Text>
              <Text className="text-sm">⏩</Text>
            </View>
          </View>
        ) : null}
        {infos.duree > 0 ? (
          <BarreProgressionVideo lecteur={lecteur} actif={actif} enPause={enPause} duree={infos.duree} largeur={largeur} bas={margeBas} onGlisser={onGlisserBarre} />
        ) : null}
      </View>
    </>
  );
}
