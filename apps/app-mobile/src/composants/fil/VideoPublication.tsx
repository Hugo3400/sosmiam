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

// Les commandes passent au-dessus de la zone d'appui de la publication (posée après le média) : sinon on ne pourrait pas les toucher
const styleCommandes = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 1 } as const;

/**
 * Vidéo d'une publication, en plein écran et en boucle ; son affiche reste dessous tant qu'elle ne joue pas. Le son suit le
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

  useEffect(() => {
    if (actif && !enPause) lecteur.play();
    else lecteur.pause();
  }, [actif, enPause, lecteur, retoursPremierPlan]);

  // Une vidéo sans son reste muette même son activé : elle ne coupe pas la musique qui joue à côté sur le téléphone
  const muette = sonCoupe || !infos.aDuSon;
  useEffect(() => {
    lecteur.muted = muette;
  }, [muette, lecteur]);

  const x2 = actif && acceleree;
  useEffect(() => {
    lecteur.playbackRate = x2 ? 2 : 1;
  }, [x2, lecteur]);

  return (
    <>
      <View style={{ position: "absolute", inset: 0 }}>
        <Image source={media.affiche} contentFit="cover" style={{ position: "absolute", inset: 0 }} />
        <VideoView player={lecteur} contentFit="cover" nativeControls={false} style={{ position: "absolute", inset: 0 }} />
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
