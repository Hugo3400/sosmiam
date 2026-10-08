import { Ionicons } from "@expo/vector-icons";
import { useEvent } from "expo";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect } from "react";
import { View } from "react-native";

import type { MediaPublication } from "~/contenus/type-publication";

type Props = {
  media: Extract<MediaPublication, { type: "video" }>;
  /** Publication affichée à l'écran : seule celle-ci joue */
  actif: boolean;
  /** Mise en pause par un appui simple */
  enPause: boolean;
};

/** Vidéo d'une publication, en plein écran et en boucle, sans son ; son affiche reste dessous tant qu'elle ne joue pas. */
export function VideoPublication({ media, actif, enPause }: Props) {
  const lecteur = useVideoPlayer(media.video, (l) => {
    l.loop = true;
    l.muted = true;
  });
  const { isPlaying } = useEvent(lecteur, "playingChange", { isPlaying: lecteur.playing });

  useEffect(() => {
    if (actif && !enPause) lecteur.play();
    else lecteur.pause();
  }, [actif, enPause, lecteur]);

  return (
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
  );
}
